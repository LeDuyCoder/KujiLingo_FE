"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, ClipboardList, Headphones, Loader2, RotateCcw, X } from "lucide-react";
import { axiosClient } from "@/shared/api/axiosClient";
import { Button } from "@/shared/components/ui/Button";
import { useLanguage } from "@/shared/i18n/language";

type QuizQuestion = {
  id: string;
  quiz_id: string;
  quiz_title: string | null;
  question: string | null;
  audio: string | null;
  image: string | null;
  answers: Array<{ id: string; answer: string | null }>;
};

type QuizResult = {
  course_id: string | null;
  lesson_completed: boolean;
  score: number;
  total: number;
  percent: number;
  results: Array<{
    question_id: string;
    selected_answer_id: string;
    correct_answer_id: string;
    is_correct: boolean;
  }>;
};

export default function LessonQuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { t, language } = useLanguage();
  const locale = language === "vi" ? "vi-VN" : "en-US";
  const { id } = use(params);
  const router = useRouter();
  const [title, setTitle] = useState(t("quiz.title"));
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    axiosClient.get(`/api/v1/lessons/${id}/quiz`)
      .then((response) => {
        if (!active) return;
        setTitle(response.data.data.lesson_title || t("quiz.title"));
        setQuestions(response.data.data.questions || []);
      })
      .catch((requestError: { response?: { status?: number; data?: { error?: { code?: string } } } }) => {
        if (!active) return;
        const code = requestError.response?.data?.error?.code;
        setError(code === "QUIZ_NOT_FOUND" ? t("quiz.noQuiz") : code === "PRO_REQUIRED" ? t("quiz.proRequired") : code === "LESSON_LOCKED" ? t("quiz.lessonLocked") : t("quiz.loadError"));
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, t]);

  const submit = async () => {
    if (questions.some((question) => !choices[question.id])) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await axiosClient.post(`/api/v1/lessons/${id}/quiz`, {
        answers: questions.map((question) => ({ question_id: question.id, answer_id: choices[question.id] })),
      });
      setResult(response.data.data);
    } catch {
      setError(t("quiz.submitError"));
    } finally {
      setSubmitting(false);
    }
  };

  const retry = () => {
    setChoices({});
    setResult(null);
    setError(null);
  };

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center bg-zinc-50"><Loader2 className="h-8 w-8 animate-spin text-[#b7152b]" /></main>;
  }

  if (error && questions.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-50 p-5">
        <section className="w-full max-w-lg rounded-3xl border border-zinc-100 bg-white p-8 text-center shadow-sm">
          <ClipboardList className="mx-auto mb-4 text-[#b7152b]" size={32} />
          <p className="font-semibold text-zinc-700">{error}</p>
          <Button onClick={() => router.back()} className="mt-6 h-10 px-5">{t("quiz.back")}</Button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6 flex items-center justify-between gap-4">
          <button onClick={() => router.push(`/lessons/${id}`)} className="inline-flex items-center gap-2 text-sm font-bold text-zinc-500 transition hover:text-zinc-900">
            <ArrowLeft size={17} /> {t("quiz.back")}
          </button>
          {result && <button onClick={retry} className="inline-flex items-center gap-2 text-sm font-bold text-[#b7152b]"><RotateCcw size={16} /> {t("quiz.retry")}</button>}
        </header>

        <section className="mb-5 rounded-3xl border border-zinc-100 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#b7152b]"><ClipboardList size={16} /> {t("quiz.title")}</div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 sm:text-3xl">{title}</h1>
          <p className="mt-2 text-sm text-zinc-500">{t("quiz.questionCount").replace("{count}", questions.length.toLocaleString(locale))}</p>
          {result && (
            <div className="mt-5 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-zinc-800">
              {t("quiz.resultLabel")} <span className="text-[#b7152b]">{t("quiz.correctCount").replace("{count}", `${result.score.toLocaleString(locale)}/${result.total.toLocaleString(locale)}`)} ({result.percent.toLocaleString(locale)}%)</span>
            </div>
          )}
        </section>

        {result && !result.lesson_completed && (
          <div role="status" className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            {t("quiz.retryHint")}
          </div>
        )}

        <div className="space-y-4">
          {questions.map((question, index) => {
            const graded = result?.results.find((item) => item.question_id === question.id);
            return (
              <section key={question.id} className="rounded-3xl border border-zinc-100 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="mb-1 text-[11px] font-extrabold uppercase tracking-wider text-zinc-400">{t("quiz.questionPrefix").replace("{number}", String(index + 1))}{question.quiz_title ? ` · ${question.quiz_title}` : ""}</p>
                    <h2 className="text-lg font-bold leading-relaxed text-zinc-900">{question.question || t("quiz.chooseAnswer")}</h2>
                  </div>
                  {question.audio && <button onClick={() => new Audio(question.audio!).play()} aria-label={t("quiz.listenQuestion")} className="rounded-full border border-zinc-200 p-2 text-zinc-500 hover:text-[#b7152b]"><Headphones size={17} /></button>}
                </div>
                {question.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={question.image} alt={t("quiz.imageAlt")} className="mb-4 max-h-56 rounded-2xl object-contain" />
                )}
                <div className="grid gap-2 sm:grid-cols-2">
                  {question.answers.map((answer, answerIndex) => {
                    const selected = choices[question.id] === answer.id;
                    const isCorrect = graded?.correct_answer_id === answer.id;
                    const isWrongSelected = graded?.selected_answer_id === answer.id && !graded.is_correct;
                    return (
                      <button
                        key={answer.id}
                        type="button"
                        disabled={Boolean(result)}
                        onClick={() => setChoices((current) => ({ ...current, [question.id]: answer.id }))}
                        className={`flex min-h-12 items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${isCorrect ? "border-emerald-300 bg-emerald-50 text-emerald-800" : isWrongSelected ? "border-rose-300 bg-rose-50 text-rose-800" : selected ? "border-[#b7152b] bg-rose-50 text-zinc-900" : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"}`}
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[11px] font-extrabold text-zinc-500">{String.fromCharCode(65 + answerIndex)}</span>
                        <span className="flex-1">{answer.answer}</span>
                        {isCorrect && <Check size={16} className="text-emerald-600" />}
                        {isWrongSelected && <X size={16} className="text-rose-600" />}
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        {error && <p role="alert" className="mt-4 text-sm font-semibold text-rose-600">{error}</p>}
        {result?.course_id && result.lesson_completed && (
          <Button onClick={() => router.push(`/courses/${result.course_id}`)} className="mt-6 h-12 w-full text-sm font-extrabold">
            {t("quiz.backToCourse")}
          </Button>
        )}
        {!result && (
          <Button onClick={submit} disabled={submitting || questions.length === 0 || questions.some((question) => !choices[question.id])} className="mt-6 h-12 w-full text-sm font-extrabold disabled:cursor-not-allowed disabled:opacity-50">
            {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("quiz.grading")}</> : t("quiz.submit")}
          </Button>
        )}
      </div>
    </main>
  );
}
