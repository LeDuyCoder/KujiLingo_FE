"use client";

import React, { useEffect, useState, use } from "react";
import {
  ChevronLeft,
  Loader2,
  BookOpen,
  Heart,
  Volume2,
  Star,
  FileText,
  Play,
  Check,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/components/ui/Button";
import { axiosClient } from "@/shared/api/axiosClient";
import { useLanguage } from "@/shared/i18n/language";

interface Vocabulary {
  id: string;
  kanji: string | null;
  hiragana: string | null;
  romaji: string | null;
  word_type: string | null;
  jlpt: string | null;
  meaning: string | null;
  is_favorited: boolean;
  learning_status: string;
}

interface GrammarPoint {
  id: string;
  title_jp: string;
  structure: string | null;
  meaning_vi: string;
  explanation: string | null;
  usage: string | null;
  jlpt_level: string;
}

interface TopicDetail {
  id: string;
  lesson_id: string | null;
  title: string | null;
  description: string | null;
  image: string | null;
  vocabularies: Vocabulary[];
  grammar_points: GrammarPoint[];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function TopicDetailPage({ params }: PageProps) {
  const { t, language } = useLanguage();
  const locale = language === "vi" ? "vi-VN" : "en-US";
  const router = useRouter();
  const resolvedParams = use(params);
  const topicId = resolvedParams.id;

  const [topic, setTopic] = useState<TopicDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favoritingIds, setFavoritingIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"vocab" | "grammar">("vocab");

  // Flashcards practice states
  const [isPracticeOpen, setIsPracticeOpen] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyResults, setStudyResults] = useState<{ id: string; correct: boolean }[]>([]);
  const [isPracticeFinished, setIsPracticeFinished] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchTopicDetail = async () => {
      try {
        setLoading(true);
        const response = await axiosClient.get(`/api/v1/topics/${topicId}`);
        if (response.data && response.data.success) {
          setTopic(response.data.data);
        } else {
          setError(t("topic.loadError"));
        }
      } catch (err) {
        console.error("Error fetching topic detail:", err);
        setError(t("topic.connectionError"));
      } finally {
        setLoading(false);
      }
    };

    if (topicId) {
      fetchTopicDetail();
    }
  }, [topicId, refreshTrigger, t]);

  const toggleFavorite = async (vocabId: string, currentFav: boolean) => {
    if (favoritingIds.has(vocabId)) return;
    setFavoritingIds((prev) => new Set(prev).add(vocabId));

    try {
      if (currentFav) {
        await axiosClient.delete(`/api/v1/favorite-vocabularies/${vocabId}`);
      } else {
        await axiosClient.post("/api/v1/favorite-vocabularies", {
          vocabulary_id: vocabId,
        });
      }
      // Update local state
      setTopic((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          vocabularies: prev.vocabularies.map((v) =>
            v.id === vocabId ? { ...v, is_favorited: !currentFav } : v
          ),
        };
      });
    } catch (err) {
      console.error("Error toggling favorite:", err);
    } finally {
      setFavoritingIds((prev) => {
        const next = new Set(prev);
        next.delete(vocabId);
        return next;
      });
    }
  };

  const speakWord = (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ja-JP";
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  };

  const handleReviewSubmit = async (correct: boolean) => {
    if (!topic || topic.vocabularies.length === 0) return;
    const currentVocab = topic.vocabularies[currentCardIndex];

    // Track results locally for the summary screen
    setStudyResults((prev) => [...prev, { id: currentVocab.id, correct }]);

    // Submit review progress to backend
    try {
      await axiosClient.post("/api/v1/learning-progress/review", {
        vocabulary_id: currentVocab.id,
        correct,
      });
    } catch (err) {
      console.error("Error submitting vocabulary review:", err);
    }

    // Advance to next card or finish
    setIsFlipped(false);
    if (currentCardIndex === topic.vocabularies.length - 1) {
      setIsPracticeFinished(true);
    } else {
      setCurrentCardIndex((prev) => prev + 1);
    }
  };

  const closePractice = () => {
    setIsPracticeOpen(false);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setStudyResults([]);
    setIsPracticeFinished(false);
    // Reload topic detail to update vocabulary status labels
    setRefreshTrigger((prev) => prev + 1);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "MASTERED":
        return { label: t("topic.statusMastered"), color: "bg-emerald-50 text-emerald-600 border-emerald-100" };
      case "REVIEWING":
        return { label: t("topic.statusReview"), color: "bg-amber-50 text-amber-600 border-amber-100" };
      case "LEARNING":
        return { label: t("topic.statusLearning"), color: "bg-blue-50 text-blue-600 border-blue-100" };
      default:
        return { label: t("topic.statusNew"), color: "bg-zinc-50 text-zinc-500 border-zinc-100" };
    }
  };

  const getJlptColor = (jlpt: string | null) => {
    switch (jlpt) {
      case "N5": return "bg-blue-100 text-blue-700";
      case "N4": return "bg-emerald-100 text-emerald-700";
      case "N3": return "bg-amber-100 text-amber-700";
      case "N2": return "bg-violet-100 text-violet-700";
      case "N1": return "bg-red-100 text-red-700";
      default: return "bg-zinc-100 text-zinc-500";
    }
  };

  const cardStyle = {
    perspective: "1000px",
  };

  const cardInnerStyle = {
    transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
    transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
    transformStyle: "preserve-3d" as const,
  };

  const cardSideStyle = {
    backfaceVisibility: "hidden" as const,
    WebkitBackfaceVisibility: "hidden" as const,
  };

  if (loading && !topic) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#b7152b]" />
        <span className="text-sm text-zinc-400 font-semibold">{t("topic.loading")}</span>
      </div>
    );
  }

  if (error || !topic) {
    return (
      <div className="bg-white border border-zinc-100 rounded-3xl p-12 text-center max-w-xl mx-auto my-12 shadow-sm space-y-4">
        <div className="w-16 h-16 bg-red-50 text-[#b7152b] rounded-full flex items-center justify-center mx-auto">
          <BookOpen size={32} />
        </div>
        <h2 className="text-xl font-extrabold text-zinc-900">{t("topic.notFound")}</h2>
        <p className="text-zinc-500 text-sm leading-relaxed">{error || t("topic.notAvailable")}</p>
        <Button onClick={() => router.back()} className="h-10 px-6 mx-auto">
          {t("topic.back")}
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8 pb-16 animate-fade-in-up">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            if (topic.lesson_id) {
              router.push(`/lessons/${topic.lesson_id}`);
            } else {
              router.back();
            }
          }}
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-950 font-bold text-sm group transition-colors"
        >
          <ChevronLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
          {t("topic.backToTopics")}
        </button>
      </div>

      {/* Topic Hero Banner */}
      <div className="relative bg-gradient-to-br from-rose-50/40 via-rose-50/10 to-white border border-zinc-100 rounded-3xl p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 overflow-hidden">
        <div className="space-y-3 z-10 max-w-3xl">
          <div className="flex items-center gap-2 text-[#b7152b]">
            <BookOpen size={16} />
            <span className="text-[10px] font-extrabold uppercase tracking-wider">{t("topic.title")}</span>
          </div>
          <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight leading-tight">
            {topic.title || t("topic.fallbackTitle")}
          </h1>
          <p className="text-zinc-500 text-sm leading-relaxed font-medium">
            {topic.description || t("topic.fallbackDescription")}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4 z-10 flex-shrink-0">
          <div className="flex gap-3 flex-shrink-0">
            <div className="bg-white border border-zinc-100 p-4 rounded-2xl shadow-sm text-center min-w-[110px] flex-shrink-0">
              <div className="flex items-center justify-center gap-1 text-zinc-400 mb-1 whitespace-nowrap">
                <FileText size={12} />
                <span className="text-[9px] font-extrabold uppercase tracking-wider whitespace-nowrap">{t("topic.vocabulary")}</span>
              </div>
              <span className="text-2xl font-extrabold text-zinc-900">{topic.vocabularies.length}</span>
            </div>
            <div className="bg-white border border-zinc-100 p-4 rounded-2xl shadow-sm text-center min-w-[110px] flex-shrink-0">
              <div className="flex items-center justify-center gap-1 text-zinc-400 mb-1 whitespace-nowrap">
                <Star size={12} />
                <span className="text-[9px] font-extrabold uppercase tracking-wider whitespace-nowrap">{t("topic.grammar")}</span>
              </div>
              <span className="text-2xl font-extrabold text-zinc-900">{topic.grammar_points.length}</span>
            </div>
          </div>

          {topic.vocabularies.length > 0 && (
            <Button
              onClick={() => setIsPracticeOpen(true)}
              className="w-full sm:w-auto h-12 px-6 rounded-2xl bg-[#b7152b] hover:bg-[#961223] text-white font-bold text-sm shadow-lg shadow-rose-500/10 flex items-center justify-center gap-2 whitespace-nowrap flex-shrink-0"
            >
              <Play size={14} fill="currentColor" />
              {t("topic.startLearning")}
            </Button>
          )}
        </div>

        <div className="absolute -top-32 -right-32 w-80 h-80 bg-rose-100/10 rounded-full blur-[80px]" />
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 border border-zinc-100 bg-zinc-50/50 rounded-2xl p-1.5 w-fit">
        <button
          onClick={() => setActiveTab("vocab")}
          className={`px-5 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
            activeTab === "vocab"
              ? "bg-white text-zinc-900 shadow-sm border border-zinc-100"
              : "text-zinc-400 hover:text-zinc-600"
          }`}
        >
          {t("topic.vocabularyTab").replace("{count}", topic.vocabularies.length.toLocaleString(locale))}
        </button>
        <button
          onClick={() => setActiveTab("grammar")}
          className={`px-5 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
            activeTab === "grammar"
              ? "bg-white text-zinc-900 shadow-sm border border-zinc-100"
              : "text-zinc-400 hover:text-zinc-600"
          }`}
        >
          {t("topic.grammarTab").replace("{count}", topic.grammar_points.length.toLocaleString(locale))}
        </button>
      </div>

      {/* Vocabulary Tab */}
      {activeTab === "vocab" && (
        <div className="space-y-3">
          {topic.vocabularies.length === 0 ? (
            <div className="bg-white border border-dashed border-zinc-200 rounded-3xl p-12 text-center text-zinc-400">
              {t("topic.emptyVocabulary")}
            </div>
          ) : (
            topic.vocabularies.map((vocab) => {
              const statusBadge = getStatusBadge(vocab.learning_status);
              return (
                <div
                  key={vocab.id}
                  className="w-full rounded-2xl border border-zinc-100 bg-white px-3.5 py-3.5 transition-colors duration-200 hover:border-zinc-200 sm:px-4 sm:py-3.5"
                >
                  <div className="flex min-w-0 items-center justify-between gap-2">
                    <span className="inline-flex min-w-0 max-w-[58%] items-center justify-center truncate rounded-xl border border-zinc-200/70 bg-zinc-50 px-3 py-1.5 text-center text-xl font-extrabold leading-tight text-zinc-900 select-all sm:text-2xl">
                      {vocab.kanji || vocab.hiragana || "—"}
                    </span>
                    <div className="flex max-w-[42%] shrink-0 items-center justify-end gap-1">
                      {vocab.jlpt && (
                        <span className={`whitespace-nowrap rounded-md px-1.5 py-0.5 text-[9px] font-bold ${getJlptColor(vocab.jlpt)}`}>
                          {vocab.jlpt}
                        </span>
                      )}
                      {vocab.word_type && (
                        <span className="truncate rounded-md bg-zinc-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-zinc-500">
                          {vocab.word_type}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="mt-2 text-sm font-medium leading-snug text-zinc-600">
                    {vocab.hiragana || vocab.romaji || vocab.kanji || "—"}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs font-medium leading-relaxed text-zinc-500">
                    {vocab.meaning || "—"}
                  </p>

                  {/* Actions */}
                  <div className="mt-2.5 flex items-center justify-end gap-1.5">
                    <span className={`inline-flex h-7 items-center rounded-lg border px-2 text-[9px] font-semibold ${statusBadge.color}`}>
                      {statusBadge.label}
                    </span>
                    <button
                      type="button"
                      aria-label={t("topic.playPronunciation").replace("{word}", vocab.kanji || vocab.hiragana || t("topic.fallbackTitle"))}
                      onClick={() => speakWord(vocab.kanji || vocab.hiragana || "")}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-100 bg-zinc-50 text-zinc-500 transition-colors hover:bg-zinc-100"
                    >
                      <Volume2 size={13} />
                    </button>
                    <button
                      type="button"
                      aria-label={vocab.is_favorited ? t("topic.removeFavorite") : t("topic.addFavorite")}
                      onClick={() => toggleFavorite(vocab.id, vocab.is_favorited)}
                      disabled={favoritingIds.has(vocab.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-100 bg-zinc-50 transition-colors hover:bg-red-50"
                    >
                      <Heart
                        size={13}
                        className={vocab.is_favorited ? "fill-red-500 text-red-500" : "text-zinc-400"}
                      />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Grammar Tab */}
      {activeTab === "grammar" && (
        <div className="space-y-4">
          {topic.grammar_points.length === 0 ? (
            <div className="bg-white border border-dashed border-zinc-200 rounded-3xl p-12 text-center text-zinc-400">
              {t("topic.emptyGrammar")}
            </div>
          ) : (
            topic.grammar_points.map((gp) => (
              <div
                key={gp.id}
                className="bg-white border border-zinc-100 hover:border-zinc-200 rounded-2xl p-6 transition-all duration-200 hover:shadow-sm space-y-3"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-lg font-extrabold text-zinc-900">{gp.title_jp}</span>
                  <span className={`px-1.5 py-0.5 text-[9px] font-extrabold rounded ${getJlptColor(gp.jlpt_level)}`}>
                    {gp.jlpt_level}
                  </span>
                </div>
                {gp.structure && (
                  <div className="bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-2.5">
                    <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block mb-0.5">{t("topic.structure")}</span>
                    <span className="text-sm font-bold text-zinc-800">{gp.structure}</span>
                  </div>
                )}
                <div className="text-sm text-zinc-700 font-medium leading-relaxed">
                  <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block mb-0.5">{t("topic.meaning")}</span>
                  {gp.meaning_vi}
                </div>
                {gp.explanation && (
                  <div className="text-xs text-zinc-500 leading-relaxed">
                    <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block mb-0.5">{t("topic.explanation")}</span>
                    {gp.explanation}
                  </div>
                )}
                {gp.usage && (
                  <div className="text-xs text-zinc-500 leading-relaxed">
                    <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block mb-0.5">{t("topic.usage")}</span>
                    {gp.usage}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      </div>

      {/* Flashcards Interactive Modal */}
      {isPracticeOpen && topic.vocabularies.length > 0 && (
        <div className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-zinc-100 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col justify-between max-h-[90vh] animate-scale-up my-auto">
            {/* Modal Header */}
            <div className="border-b border-zinc-100 px-6 py-4 flex items-center justify-between bg-zinc-50/50">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-[#b7152b] uppercase tracking-wider">{t("topic.learnVocabulary")}</span>
                <h3 className="font-extrabold text-sm text-zinc-950 truncate max-w-[280px]">
                  {topic.title}
                </h3>
              </div>
              <button 
                onClick={closePractice}
                className="text-zinc-400 hover:text-zinc-600 font-bold text-sm bg-white border border-zinc-200 w-8 h-8 rounded-full flex items-center justify-center shadow-sm"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex flex-col items-center justify-center flex-grow min-h-[350px]">
              {!isPracticeFinished ? (
                <div className="w-full flex flex-col items-center space-y-6">
                  {/* Progress Indicators */}
                  <div className="w-full space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">
                          <span>{t("topic.progress")}</span>
                      <span>{currentCardIndex + 1} / {topic.vocabularies.length} từ</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#b7152b] transition-all duration-300"
                        style={{ width: `${((currentCardIndex + 1) / topic.vocabularies.length) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* 3D Flip Card Container */}
                  <div 
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="w-full aspect-[4/3] max-w-sm cursor-pointer relative"
                    style={cardStyle}
                  >
                    <div 
                      className="w-full h-full relative"
                      style={cardInnerStyle}
                    >
                      {/* FRONT OF THE CARD */}
                      <div 
                        className="absolute inset-0 bg-gradient-to-br from-zinc-50 to-white border border-zinc-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between items-center"
                        style={{ ...cardSideStyle, zIndex: isFlipped ? 0 : 2 }}
                      >
                        <div className="w-full flex justify-between items-center text-[9px] font-extrabold text-zinc-400 uppercase tracking-wider">
                          <span>{t("topic.flashcard")}</span>
                          <span>{t("topic.tapMeaning")}</span>
                        </div>
                        <div className="text-center space-y-2">
                          <span 
                            className="text-5xl font-extrabold text-zinc-950 select-none block tracking-tight"
                            style={{ whiteSpace: "nowrap", wordBreak: "keep-all" }}
                          >
                            {topic.vocabularies[currentCardIndex].kanji || topic.vocabularies[currentCardIndex].hiragana}
                          </span>
                        </div>
                        <div className="w-full flex justify-center">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              speakWord(topic.vocabularies[currentCardIndex].kanji || topic.vocabularies[currentCardIndex].hiragana || "");
                            }}
                            className="w-10 h-10 rounded-full bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 flex items-center justify-center text-zinc-600 transition-colors shadow-sm"
                          >
                            <Volume2 size={16} />
                          </button>
                        </div>
                      </div>

                      {/* BACK OF THE CARD */}
                      <div 
                        className="absolute inset-0 bg-white border-2 border-[#b7152b] rounded-2xl p-6 shadow-lg flex flex-col justify-between items-center"
                        style={{ ...cardSideStyle, transform: "rotateY(180deg)", zIndex: isFlipped ? 2 : 0 }}
                      >
                        <div className="w-full flex justify-between items-center text-[9px] font-extrabold text-zinc-400 uppercase tracking-wider">
                          <span>{t("topic.meaningReading")}</span>
                          <span>{t("topic.tapFlip")}</span>
                        </div>
                        <div className="text-center space-y-3">
                          <span 
                            className="text-3xl font-extrabold text-[#b7152b] select-none block leading-tight"
                            style={{ whiteSpace: "nowrap", wordBreak: "keep-all" }}
                          >
                            {topic.vocabularies[currentCardIndex].kanji || topic.vocabularies[currentCardIndex].hiragana}
                          </span>
                          <div className="space-y-1">
                            <span className="text-base font-extrabold text-zinc-900 block select-none">
                              {topic.vocabularies[currentCardIndex].hiragana}
                            </span>
                            {topic.vocabularies[currentCardIndex].romaji && (
                              <span className="text-xs font-bold text-zinc-400 block select-none uppercase tracking-wider">
                                {topic.vocabularies[currentCardIndex].romaji}
                              </span>
                            )}
                          </div>
                          <span className="text-sm font-bold text-zinc-600 bg-zinc-50 border border-zinc-100 px-4 py-1.5 rounded-xl block max-w-[240px] select-none">
                            {topic.vocabularies[currentCardIndex].meaning}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          {topic.vocabularies[currentCardIndex].jlpt && (
                            <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded ${getJlptColor(topic.vocabularies[currentCardIndex].jlpt)}`}>
                              {topic.vocabularies[currentCardIndex].jlpt}
                            </span>
                          )}
                          {topic.vocabularies[currentCardIndex].word_type && (
                            <span className="bg-zinc-50 text-zinc-400 border border-zinc-200 px-2 py-0.5 text-[9px] font-extrabold rounded uppercase">
                              {topic.vocabularies[currentCardIndex].word_type}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex gap-4 w-full max-w-sm">
                    <button
                      onClick={() => handleReviewSubmit(false)}
                      className="flex-1 h-11 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 font-extrabold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      ✕ {t("topic.reviewNotYet")}
                    </button>
                    <button
                      onClick={() => handleReviewSubmit(true)}
                      className="flex-1 h-11 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-100 font-extrabold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      ✓ {t("topic.reviewMastered")}
                    </button>
                  </div>
                </div>
              ) : (
                /* Completion Summary Screen */
                <div className="w-full flex flex-col items-center text-center space-y-5 py-6">
                  <div className="w-20 h-20 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/10">
                    <Check size={40} strokeWidth={3} />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xl font-extrabold text-zinc-950">{t("topic.lessonComplete")}</h4>
                    <p className="text-xs text-zinc-500 max-w-xs mx-auto leading-relaxed">
                      {t("topic.studiedSummary").replace("{count}", topic.vocabularies.length.toLocaleString(locale))}
                    </p>
                  </div>
                  <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-4 w-full max-w-sm flex justify-around">
                    <div>
                      <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">{t("topic.mastered")}</span>
                      <span className="text-xl font-extrabold text-emerald-600">
                        {studyResults.filter(r => r.correct).length}
                      </span>
                    </div>
                    <div className="border-r border-zinc-200" />
                    <div>
                      <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">{t("topic.notMastered")}</span>
                      <span className="text-xl font-extrabold text-rose-600">
                        {studyResults.filter(r => !r.correct).length}
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={closePractice}
                    className="w-full max-w-sm h-11 rounded-xl bg-[#b7152b] hover:bg-[#961223] text-white font-bold text-xs shadow-md"
                  >
                    {t("topic.finishReturn")}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
