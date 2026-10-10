"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Check, ChevronRight, Eraser, RotateCcw, Eye, EyeOff, PenLine, X } from "lucide-react";
import { axiosClient } from "@/shared/api/axiosClient";
import { useLanguage } from "@/shared/i18n/language";
import { loadTargetStrokes, validateStroke, type Point, type PositionedTargetStroke, type TargetStroke } from "./stroke-validator";

interface FolderWord {
  id: string;
  kanji: string | null;
  hiragana: string | null;
  meaning: string | null;
  note?: string | null;
}

interface FolderContents {
  name: string;
  system_vocabularies: FolderWord[];
  user_vocabularies: FolderWord[];
}

interface KanjiClue {
  reading: string;
  meaning: string;
}

interface KanjiPrompt {
  answer: string;
  clues: KanjiClue[];
}

function shuffle<T,>(items: T[]): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const current = shuffled[index]!;
    shuffled[index] = shuffled[swapIndex]!;
    shuffled[swapIndex] = current;
  }
  return shuffled;
}

function makePrompts(words: FolderWord[]): KanjiPrompt[] {
  const prompts = new Map<string, KanjiPrompt>();

  words.forEach((word) => {
    const answer = word.kanji?.trim();
    if (!answer || !/\p{Script=Han}/u.test(answer)) return;

    const clue: KanjiClue = {
      reading: word.hiragana || "Reading not available",
      meaning: word.meaning || word.note || "Meaning not available",
    };
    const prompt = prompts.get(answer);
    if (prompt) {
      if (!prompt.clues.some((item) => item.reading === clue.reading && item.meaning === clue.meaning)) {
        prompt.clues.push(clue);
      }
    } else {
      prompts.set(answer, { answer, clues: [clue] });
    }
  });

  return shuffle(Array.from(prompts.values()));
}

export default function KanjiWritingPage() {
  const { t } = useLanguage();
  const params = useParams();
  const folderId = params.folderId as string;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const temporaryUserStrokeRef = useRef<Point[]>([]);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [folderName, setFolderName] = useState("");
  const [prompts, setPrompts] = useState<KanjiPrompt[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [needsPracticeCount, setNeedsPracticeCount] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [targetStrokes, setTargetStrokes] = useState<TargetStroke[]>([]);
  const [completedStrokeIndexes, setCompletedStrokeIndexes] = useState<number[]>([]);
  const [strokeDataStatus, setStrokeDataStatus] = useState<"loading" | "ready" | "error">("loading");
  const [strokeFeedback, setStrokeFeedback] = useState<"accepted" | "rejected" | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0, fontSize: 0 });
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const currentPrompt = prompts[currentIndex];

  useEffect(() => {
    let cancelled = false;

    const fetchFolder = async () => {
      try {
        const response = await axiosClient.get(`/folders/${folderId}/contents`);
        const folder = response.data?.data as FolderContents | undefined;
        if (!folder) throw new Error("Folder contents missing");

        const words = [...(folder.system_vocabularies || []), ...(folder.user_vocabularies || [])];
        const nextPrompts = makePrompts(words);
        if (cancelled) return;

        setFolderName(folder.name || "My folder");
        setPrompts(nextPrompts);
        setLoadError(false);
      } catch (error) {
        console.error("Could not load Kanji writing practice:", error);
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchFolder();
    return () => {
      cancelled = true;
    };
  }, [folderId]);

  useEffect(() => {
    if (!currentPrompt) return;
    let cancelled = false;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (canvas && context) context.clearRect(0, 0, canvas.width, canvas.height);

    queueMicrotask(() => {
      if (cancelled) return;
      const characters = Array.from(currentPrompt.answer);
      const japaneseCharacter = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u;

      setStrokeDataStatus("loading");
      setTargetStrokes([]);
      setCompletedStrokeIndexes([]);
      setStrokeFeedback(null);
      temporaryUserStrokeRef.current = [];

      Promise.all(
        characters.map((character, index) => japaneseCharacter.test(character)
          ? loadTargetStrokes(character, index)
          : Promise.resolve([])),
      ).then((strokeGroups) => {
        if (cancelled) return;
        const strokes = strokeGroups.flat();
        if (strokes.length === 0) throw new Error("No stroke paths found for this answer");
        setTargetStrokes(strokes);
        setStrokeDataStatus("ready");
      }).catch((error: unknown) => {
        console.error("Could not load KanjiVG stroke paths:", error);
        if (!cancelled) setStrokeDataStatus("error");
      });
    });

    return () => { cancelled = true; };
  }, [currentPrompt]);

  useEffect(() => () => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
  }, []);

  const characterCells = useMemo(() => {
    const characters = Array.from(currentPrompt?.answer || "");
    if (!canvasSize.width || !canvasSize.height || characters.length === 0) return [];

    const fontSize = canvasSize.fontSize;
    if (!fontSize) return [];
    const columns = Math.max(1, Math.floor((canvasSize.width - 40) / fontSize));
    const rows = Math.ceil(characters.length / columns);
    const firstY = (canvasSize.height - rows * fontSize) / 2;

    return characters.map((character, index) => {
      const row = Math.floor(index / columns);
      const rowStart = row * columns;
      const charsInRow = Math.min(columns, characters.length - rowStart);
      const rowWidth = charsInRow * fontSize;
      return {
        character,
        characterIndex: index,
        x: (canvasSize.width - rowWidth) / 2 + (index - rowStart) * fontSize,
        y: firstY + row * fontSize,
        size: fontSize,
      };
    });
  }, [currentPrompt, canvasSize]);

  const positionedTargetStrokes = useMemo<PositionedTargetStroke[]>(() => {
    return targetStrokes.flatMap((stroke) => {
      const cell = characterCells[stroke.characterIndex];
      if (!cell) return [];
      const scale = cell.size / 109;
      return [{
        ...stroke,
        cellSize: cell.size,
        positionedPoints: stroke.points.map((point) => ({ x: cell.x + point.x * scale, y: cell.y + point.y * scale })),
      }];
    });
  }, [targetStrokes, characterCells]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const bounds = canvas.getBoundingClientRect();
      const pixelRatio = window.devicePixelRatio || 1;
      canvas.width = Math.round(bounds.width * pixelRatio);
      canvas.height = Math.round(bounds.height * pixelRatio);
      const fontSize = Math.min(96, Math.max(48, window.innerWidth * 0.14));
      setCanvasSize((size) => size.width === bounds.width && size.height === bounds.height && size.fontSize === fontSize
        ? size
        : { width: bounds.width, height: bounds.height, fontSize });

      const context = canvas.getContext("2d");
      if (!context) return;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.lineCap = "round";
      context.lineJoin = "round";
      context.lineWidth = 8;
      context.strokeStyle = "#18181b";
    };

    resizeCanvas();
    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [loading, isFinished]);

  const clearCanvas = useCallback(() => {
    drawingRef.current = false;
    temporaryUserStrokeRef.current = [];
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (canvas && context) {
      context.save();
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.restore();
    }
  }, []);

  const getCanvasPoint = (event: PointerEvent<HTMLCanvasElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
  };

  const handlePointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    if (isRevealed || strokeDataStatus !== "ready" || completedStrokeIndexes.length >= positionedTargetStrokes.length) return;
    const context = event.currentTarget.getContext("2d");
    if (!context) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    const point = getCanvasPoint(event);
    temporaryUserStrokeRef.current = [point];
    context.beginPath();
    context.moveTo(point.x, point.y);
    drawingRef.current = true;
    setStrokeFeedback(null);
  };

  const handlePointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || isRevealed) return;
    const context = event.currentTarget.getContext("2d");
    if (!context) return;

    const point = getCanvasPoint(event);
    temporaryUserStrokeRef.current.push(point);
    context.lineTo(point.x, point.y);
    context.stroke();
  };

  const stopDrawing = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const context = event.currentTarget.getContext("2d");
    if (!context) return;

    drawingRef.current = false;
    const releasePoint = getCanvasPoint(event);
    const previousPoint = temporaryUserStrokeRef.current.at(-1);
    if (previousPoint && Math.hypot(releasePoint.x - previousPoint.x, releasePoint.y - previousPoint.y) > 0.5) {
      temporaryUserStrokeRef.current.push(releasePoint);
      context.lineTo(releasePoint.x, releasePoint.y);
      context.stroke();
    }
    const userStroke = temporaryUserStrokeRef.current;
    const strokeIndex = completedStrokeIndexes.length;
    const target = positionedTargetStrokes[strokeIndex];
    const strokeTolerance = target ? Math.max(8, Math.min(18, target.cellSize * 0.08)) : 8;
    const result = target
      ? validateStroke(userStroke, target.positionedPoints, strokeTolerance)
      : { accepted: false as const, reason: "accuracy" as const };

    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, event.currentTarget.width, event.currentTarget.height);
    context.restore();
    temporaryUserStrokeRef.current = [];

    if (result.accepted) {
      setCompletedStrokeIndexes((indexes) => [...indexes, strokeIndex]);
      setStrokeFeedback("accepted");
    } else {
      setStrokeFeedback("rejected");
    }
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => setStrokeFeedback(null), 700);
  };

  const handleGrade = (wasCorrect: boolean) => {
    if (wasCorrect) setCorrectCount((count) => count + 1);
    else setNeedsPracticeCount((count) => count + 1);

    if (currentIndex >= prompts.length - 1) {
      setIsFinished(true);
      return;
    }

    clearCanvas();
    setIsRevealed(false);
    setShowHint(false);
    setCurrentIndex((index) => index + 1);
  };

  const restart = () => {
    setPrompts((items) => shuffle(items));
    setCurrentIndex(0);
    setCorrectCount(0);
    setNeedsPracticeCount(0);
    setCompletedStrokeIndexes([]);
    setStrokeFeedback(null);
    setIsRevealed(false);
    setShowHint(false);
    setIsFinished(false);
    clearCanvas();
  };

  const currentClue = currentPrompt?.clues[0];
  const progressPercent = prompts.length ? Math.round(((currentIndex + (isFinished ? 0 : 1)) / prompts.length) * 100) : 0;
  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      <div className="flex items-center gap-2 text-sm font-semibold text-zinc-500">
        <Link href={`/my-words/${folderId}/learn`} className="inline-flex items-center gap-1.5 transition hover:text-zinc-900">
          <ArrowLeft size={16} /> {t("kanjiWriting.mode")}
        </Link>
        <ChevronRight size={15} />
        <span className="truncate text-zinc-800">{folderName}</span>
      </div>

      <section className="overflow-hidden rounded-3xl border border-zinc-100 bg-white shadow-sm">
        <header className="border-b border-zinc-100 p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2 text-violet-600">
                <PenLine size={18} />
                <span className="text-xs font-extrabold uppercase tracking-wider">{t("learn.kanjiWriting")}</span>
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-zinc-950">{t("kanjiWriting.title")}</h1>
              <p className="mt-1 text-sm text-zinc-500">{t("kanjiWriting.practiceFolder").replace("{folder}", folderName)}</p>
            </div>
            <Link
              href={`/my-words/${folderId}/learn`}
              aria-label={t("kanjiWriting.exit")}
              className="rounded-full p-2 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-800"
            >
              <X size={19} />
            </Link>
          </div>

          {prompts.length > 0 && !isFinished && (
            <div className="mt-6">
              <div className="mb-2 flex justify-between text-xs font-bold text-zinc-500">
                <span>{t("kanjiWriting.word")} {currentIndex + 1} {t("kanjiWriting.of")} {prompts.length}</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                <div className="h-full rounded-full bg-violet-600 transition-all" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          )}
        </header>

        {loadError ? (
          <div className="p-10 text-center">
            <p className="font-bold text-zinc-800">{t("kanjiWriting.loadError")}</p>
            <Link href={`/my-words/${folderId}/learn`} className="mt-4 inline-flex items-center gap-2 font-bold text-violet-700 hover:underline">
              <ArrowLeft size={16} /> {t("kanjiWriting.backModes")}
            </Link>
          </div>
        ) : prompts.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
              <PenLine size={26} />
            </div>
            <h2 className="text-lg font-extrabold text-zinc-900">{t("kanjiWriting.emptyTitle")}</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">{t("kanjiWriting.emptyHint")}</p>
            <Link href={`/my-words/${folderId}/learn`} className="mt-5 inline-flex items-center gap-2 font-bold text-violet-700 hover:underline">
              <ArrowLeft size={16} /> {t("kanjiWriting.backModes")}
            </Link>
          </div>
        ) : isFinished ? (
          <div className="p-8 text-center sm:p-12">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
              <Check size={30} />
            </div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-violet-600">{t("kanjiWriting.sessionComplete")}</p>
            <h2 className="mt-2 text-2xl font-extrabold text-zinc-950">{t("kanjiWriting.encouragement")}</h2>
            <p className="mt-3 text-sm font-semibold text-zinc-500">
              {correctCount} {t("kanjiWriting.correctCount")} · {needsPracticeCount} {t("kanjiWriting.practiceAgainCount")}
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <button onClick={restart} className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-700">
                <RotateCcw size={16} /> {t("kanjiWriting.practiceAgain")}
              </button>
              <Link href={`/my-words/${folderId}/learn`} className="rounded-full border border-zinc-200 px-5 py-3 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50">
                {t("kanjiWriting.mode")}
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,0.85fr)_minmax(320px,1.15fr)]">
            <div className="flex flex-col justify-center">
              <p className="text-xs font-extrabold uppercase tracking-wider text-zinc-400">{t("kanjiWriting.writeFor")}</p>
              <p className="mt-2 text-3xl font-extrabold text-zinc-900">{currentClue?.reading}</p>
              <p className="mt-2 text-base font-semibold text-zinc-600">{currentClue?.meaning}</p>
              {currentPrompt.clues.length > 1 && (
                <p className="mt-3 text-xs font-semibold text-zinc-400">{t("kanjiWriting.occurrences").replace("{count}", String(currentPrompt.clues.length))}</p>
              )}

              {isRevealed ? (
                <div className="mt-7 rounded-2xl border border-violet-100 bg-violet-50 p-5">
                  <p className="text-xs font-extrabold uppercase tracking-wider text-violet-600">{t("kanjiWriting.answer")}</p>
                  <p className="mt-1 break-all text-5xl font-black text-zinc-900 sm:text-6xl">{currentPrompt.answer}</p>
                  <p className="mt-5 text-sm font-bold text-zinc-700">{t("kanjiWriting.howDidYouDo")}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button onClick={() => handleGrade(true)} className="rounded-xl bg-emerald-600 px-3 py-3 text-sm font-bold text-white transition hover:bg-emerald-700">
                      {t("kanjiWriting.gotIt")}
                    </button>
                    <button onClick={() => handleGrade(false)} className="rounded-xl border border-violet-200 bg-white px-3 py-3 text-sm font-bold text-violet-700 transition hover:bg-violet-100">
                      {t("kanjiWriting.needMorePractice")}
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setIsRevealed(true)} className="mt-7 inline-flex w-fit items-center gap-2 rounded-full border border-violet-200 px-4 py-2.5 text-sm font-bold text-violet-700 transition hover:bg-violet-50">
                  <Eye size={16} /> {t("kanjiWriting.showAnswer")}
                </button>
              )}
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-extrabold text-zinc-800">{t("kanjiWriting.writeHere")}</p>
                  <p className="mt-0.5 text-xs font-semibold text-zinc-400">
                    {strokeDataStatus === "loading"
                      ? t("kanjiWriting.loadingStrokes")
                      : strokeDataStatus === "error"
                        ? t("kanjiWriting.strokeGuideUnavailable")
                        : `${completedStrokeIndexes.length} / ${positionedTargetStrokes.length} ${t("kanjiWriting.strokes")}`}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowHint((visible) => !visible)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${showHint ? "bg-violet-50 text-violet-700" : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"}`}
                  >
                    {showHint ? <EyeOff size={14} /> : <Eye size={14} />}
                    {showHint ? t("kanjiWriting.hideHint") : t("kanjiWriting.showHint")}
                  </button>
                  <button type="button" onClick={clearCanvas} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800">
                    <Eraser size={14} /> {t("kanjiWriting.clear")}
                  </button>
                </div>
              </div>
              <div className="relative mx-auto aspect-square w-full max-w-[420px] overflow-hidden rounded-2xl border border-zinc-200 bg-white">
                <div
                  aria-hidden="true"
                  className="absolute inset-0"
                  style={{
                    backgroundImage: "linear-gradient(to right, transparent calc(50% - 1px), #e4e4e7 50%, transparent calc(50% + 1px)), linear-gradient(to bottom, transparent calc(50% - 1px), #e4e4e7 50%, transparent calc(50% + 1px))",
                  }}
                />
                {canvasSize.width > 0 && canvasSize.height > 0 && (
                  <svg
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 h-full w-full"
                    viewBox={`0 0 ${canvasSize.width} ${canvasSize.height}`}
                    preserveAspectRatio="none"
                  >
                    {positionedTargetStrokes.map((stroke, index) => {
                      const cell = characterCells[stroke.characterIndex]!;
                      const completed = completedStrokeIndexes.includes(index);
                      return (
                        <path
                          key={`${stroke.characterIndex}-${stroke.strokeNumber}`}
                          d={stroke.path}
                          transform={`translate(${cell.x} ${cell.y}) scale(${cell.size / 109})`}
                          fill="none"
                          stroke={completed ? "#18181b" : "#8b5cf6"}
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          opacity={completed ? 1 : showHint ? 0.28 : 0}
                          style={{ transition: "stroke 280ms ease, opacity 280ms ease" }}
                        />
                      );
                    })}
                  </svg>
                )}
                <canvas
                  ref={canvasRef}
                  aria-label={t("kanjiWriting.canvasLabel")}
                  className={`absolute inset-0 h-full w-full touch-none ${isRevealed || strokeDataStatus !== "ready" || completedStrokeIndexes.length >= positionedTargetStrokes.length ? "pointer-events-none" : "cursor-crosshair"}`}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={stopDrawing}
                  onPointerCancel={stopDrawing}
                  onLostPointerCapture={stopDrawing}
                />
                {strokeFeedback && !isRevealed && (
                  <span className={`pointer-events-none absolute bottom-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold shadow-sm transition-colors ${strokeFeedback === "accepted" ? "text-emerald-600" : "text-rose-600"}`}>
                    {strokeFeedback === "accepted" ? t("kanjiWriting.accepted") : t("kanjiWriting.tryAgain")}
                  </span>
                )}
                {!isRevealed && (
                  <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-zinc-400 shadow-sm">
                    {strokeDataStatus === "ready" && completedStrokeIndexes.length === positionedTargetStrokes.length
                      ? t("kanjiWriting.allStrokesComplete")
                      : showHint ? t("kanjiWriting.traceInOrder") : t("kanjiWriting.drawHint")}
                  </span>
                )}
              </div>
              <p className="mt-2 text-right text-[10px] text-zinc-400">
                {t("kanjiWriting.strokeData")}: <a href="https://kanjivg.tagaini.net/" target="_blank" rel="noreferrer" className="underline hover:text-zinc-600">KanjiVG</a> · CC BY-SA 3.0
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
