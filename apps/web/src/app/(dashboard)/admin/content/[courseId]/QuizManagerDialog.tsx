"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Check, LoaderCircle, Pencil, Plus, Trash2, X } from "lucide-react";
import { axiosClient } from "@/shared/api/axiosClient";
import { useAppDialog } from "@/shared/components/ui/AppDialogProvider";
import { useLanguage } from "@/shared/i18n/language";

type QuizAnswer = { id?: string; answer: string; is_correct: boolean };
type QuizQuestion = { id?: string; question: string; audio: string | null; image: string | null; answers: QuizAnswer[] };
type SavedAnswer = { id: string; answer: string | null; is_correct: boolean | null };
type SavedQuestion = { id: string; question: string | null; audio: string | null; image: string | null; quiz_answers: SavedAnswer[] };
type Quiz = { id: string; title: string | null; quiz_questions: SavedQuestion[] };
type QuizForm = { id?: string; title: string; questions: QuizQuestion[] };
type Props = { topicId: string; topicTitle: string; onClose: () => void; onSaved: () => void };

function newQuestion(): QuizQuestion {
  return { question: "", audio: null, image: null, answers: Array.from({ length: 4 }, (_, index) => ({ answer: "", is_correct: index === 0 })) };
}

function questionOrder(question: { question: string | null }) {
  return Number(question.question?.match(/^Câu\s+(\d+)\b/i)?.[1] ?? Number.MAX_SAFE_INTEGER);
}

export default function QuizManagerDialog({ topicId, topicTitle, onClose, onSaved }: Props) {
  const { confirm } = useAppDialog();
  const { t } = useLanguage();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [form, setForm] = useState<QuizForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axiosClient.get(`/api/v1/admin/topics/${topicId}/quizzes`);
      setQuizzes(response.data.data ?? []);
    } catch {
      setError(t("admin.quiz.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t, topicId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const edit = (quiz?: Quiz) => {
    setError("");
    setNotice("");
    setForm(quiz ? {
      id: quiz.id,
      title: quiz.title ?? "",
      questions: [...quiz.quiz_questions]
        .sort((a, b) => questionOrder(a) - questionOrder(b) || a.id.localeCompare(b.id))
        .map(({ quiz_answers, ...question }) => ({
          ...question,
          question: question.question ?? "",
          answers: quiz_answers.map((answer) => ({ ...answer, answer: answer.answer ?? "", is_correct: answer.is_correct === true })),
        })),
    } : { title: "", questions: [newQuestion()] });
  };

  const updateQuestion = (index: number, update: Partial<QuizQuestion>) => {
    setForm((current) => current ? {
      ...current,
      questions: current.questions.map((question, questionIndex) => questionIndex === index ? { ...question, ...update } : question),
    } : current);
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!form) return;
    setSaving(true);
    setError("");
    setNotice("");
    const payload = {
      title: form.title.trim(),
      questions: form.questions.map((question, index) => ({
        ...question,
        question: /^Câu\s+\d+\b/i.test(question.question.trim()) ? question.question.trim() : `Câu ${index + 1}. ${question.question.trim()}`,
        answers: question.answers.map((answer) => ({ ...answer, answer: answer.answer.trim() })),
      })),
    };
    try {
      if (form.id) await axiosClient.patch(`/api/v1/admin/quizzes/${form.id}`, payload);
      else await axiosClient.post(`/api/v1/admin/topics/${topicId}/quizzes`, payload);
      setForm(null);
      setNotice(t("admin.quiz.saved"));
      await load();
      onSaved();
    } catch {
      setError(t("admin.quiz.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (quiz: Quiz) => {
    const description = t("admin.quiz.deleteDescription").replace("{title}", quiz.title ?? t("admin.quiz.untitled"));
    if (!await confirm({ title: t("admin.quiz.deleteTitle"), description, confirmLabel: t("admin.quiz.deleteConfirm"), tone: "danger" })) return;
    setError("");
    try {
      await axiosClient.delete(`/api/v1/admin/quizzes/${quiz.id}`);
      setNotice(t("admin.quiz.deleted"));
      await load();
      onSaved();
    } catch {
      setError(t("admin.quiz.deleteError"));
    }
  };

  const valid = Boolean(form?.title.trim()) && Boolean(form?.questions.length) && form?.questions.every((question) =>
    question.question.trim() && question.answers.length === 4 && question.answers.every((answer) => answer.answer.trim()) && question.answers.filter((answer) => answer.is_correct).length === 1,
  );

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-3 sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="quiz-manager-title" className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-zinc-100 px-5 py-4 sm:px-6"><div><p className="text-xs font-bold uppercase tracking-wider text-[#b7152b]">{t("admin.quiz.title")}</p><h2 id="quiz-manager-title" className="mt-1 text-lg font-black">{topicTitle}</h2></div><button type="button" aria-label={t("admin.quiz.close")} onClick={onClose} className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100"><X size={18}/></button></header>
        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
          {error && <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
          {notice && <div role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{notice}</div>}
          {form ? <form onSubmit={(event) => void save(event)} className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end"><label className="flex-1 space-y-1.5 text-xs font-bold text-zinc-600">{t("admin.quiz.name")}<input required maxLength={255} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm font-medium text-zinc-900"/></label><button type="button" onClick={() => setForm({ ...form, questions: [...form.questions, newQuestion()] })} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-200 px-3 text-sm font-bold text-zinc-700 hover:bg-zinc-50"><Plus size={15}/>{t("admin.quiz.addQuestion")}</button></div>
            {form.questions.map((question, questionIndex) => <article key={question.id ?? `new-${questionIndex}`} className="rounded-xl border border-zinc-200 p-4">
              <div className="mb-3 flex items-center justify-between gap-3"><h3 className="text-sm font-extrabold">{t("admin.quiz.question")} {questionIndex + 1}</h3><button type="button" disabled={form.questions.length <= 1} onClick={() => setForm({ ...form, questions: form.questions.filter((_, index) => index !== questionIndex) })} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-zinc-600 hover:bg-zinc-100 disabled:opacity-40"><Trash2 size={13}/>{t("admin.quiz.removeQuestion")}</button></div>
              <label className="block space-y-1.5 text-xs font-bold text-zinc-600">{t("admin.quiz.questionBody")}<textarea required rows={2} maxLength={2000} value={question.question} onChange={(event) => updateQuestion(questionIndex, { question: event.target.value })} className="w-full rounded-xl border border-zinc-200 p-3 text-sm font-medium text-zinc-900"/></label>
              <div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="space-y-1.5 text-xs font-bold text-zinc-600">{t("admin.quiz.optionalAudio")}<input type="url" maxLength={500} value={question.audio ?? ""} onChange={(event) => updateQuestion(questionIndex, { audio: event.target.value || null })} className="h-9 w-full rounded-lg border border-zinc-200 px-3 text-xs font-medium text-zinc-900"/></label><label className="space-y-1.5 text-xs font-bold text-zinc-600">{t("admin.quiz.optionalImage")}<input type="url" maxLength={500} value={question.image ?? ""} onChange={(event) => updateQuestion(questionIndex, { image: event.target.value || null })} className="h-9 w-full rounded-lg border border-zinc-200 px-3 text-xs font-medium text-zinc-900"/></label></div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">{question.answers.map((answer, answerIndex) => <label key={answer.id ?? `${questionIndex}-answer-${answerIndex}`} className={`flex items-center gap-2 rounded-xl border p-2.5 ${answer.is_correct ? "border-emerald-300 bg-emerald-50/50" : "border-zinc-200"}`}><input type="radio" name={`correct-${question.id ?? questionIndex}`} checked={answer.is_correct} onChange={() => updateQuestion(questionIndex, { answers: question.answers.map((item, index) => ({ ...item, is_correct: index === answerIndex })) })} aria-label={t("admin.quiz.selectCorrect").replace("{number}", String(answerIndex + 1))} className="h-4 w-4 accent-emerald-600"/><span className="w-5 shrink-0 text-xs font-black text-zinc-600">{String.fromCharCode(65 + answerIndex)}</span><input required maxLength={1000} value={answer.answer} onChange={(event) => updateQuestion(questionIndex, { answers: question.answers.map((item, index) => index === answerIndex ? { ...item, answer: event.target.value } : item) })} placeholder={t("admin.quiz.answerPlaceholder").replace("{number}", String(answerIndex + 1))} className="min-w-0 flex-1 bg-transparent text-sm text-zinc-900 outline-none"/>{answer.is_correct && <Check size={15} className="shrink-0 text-emerald-600"/>}</label>)}</div>
              <p className="mt-2 text-[11px] text-zinc-600">{t("admin.quiz.correctHint")}</p>
            </article>)}
            <div className="flex flex-wrap justify-end gap-2 border-t border-zinc-100 pt-4"><button type="button" onClick={() => setForm(null)} className="rounded-xl px-4 py-2.5 text-sm font-bold text-zinc-600 hover:bg-zinc-50">{t("admin.quiz.back")}</button><button disabled={!valid || saving} className="inline-flex items-center gap-2 rounded-xl bg-[#b7152b] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{saving && <LoaderCircle size={15} className="animate-spin"/>}{t("admin.quiz.save")}</button></div>
          </form> : <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-zinc-600">{quizzes.length} {t("admin.quiz.quizCount")}</p><button type="button" onClick={() => edit()} className="inline-flex items-center gap-2 rounded-xl bg-[#b7152b] px-4 py-2.5 text-sm font-bold text-white"><Plus size={15}/>{t("admin.quiz.create")}</button></div>
            {loading ? <div className="py-12 text-center text-zinc-600"><LoaderCircle aria-label={t("admin.quiz.loading")} className="mx-auto animate-spin"/></div> : quizzes.length === 0 ? <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center text-sm text-zinc-600">{t("admin.quiz.topicEmpty")}</div> : <div className="space-y-3">{quizzes.map((quiz) => <article key={quiz.id} className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-4 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><h3 className="font-extrabold text-zinc-900">{quiz.title || t("admin.quiz.untitled")}</h3><p className="mt-1 text-xs text-zinc-600">{quiz.quiz_questions.length} {t("admin.quiz.questionCount")} · {quiz.quiz_questions.reduce((sum, question) => sum + question.quiz_answers.length, 0)} {t("admin.quiz.answerCount")}</p></div><div className="flex gap-2"><button type="button" onClick={() => edit(quiz)} className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-bold hover:bg-zinc-50"><Pencil size={13}/>{t("admin.quiz.edit")}</button><button type="button" onClick={() => void remove(quiz)} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50"><Trash2 size={13}/>{t("admin.quiz.delete")}</button></div></article>)}</div>}
          </>}
        </div>
      </section>
    </div>
  );
}
