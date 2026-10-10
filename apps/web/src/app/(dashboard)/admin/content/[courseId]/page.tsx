"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, BookOpen, ListChecks, LoaderCircle, Pencil, Plus, Trash2, X } from "lucide-react";
import { axiosClient } from "@/shared/api/axiosClient";
import { useAppDialog } from "@/shared/components/ui/AppDialogProvider";
import { useLanguage } from "@/shared/i18n/language";
import QuizManagerDialog from "./QuizManagerDialog";
import TopicVocabularyManager from "./TopicVocabularyManager";

type Topic = { id: string; title: string | null; description: string | null; image: string | null; order_no: number };
type Lesson = { id: string; title: string | null; description: string | null; order_no: number | null; quiz_count: number; topics?: Topic[] };
type Course = { id: string; title: string | null; description: string | null; lessons: Lesson[] };
type ItemForm = { title: string; description: string; image: string; order_no: string };
const emptyForm: ItemForm = { title: "", description: "", image: "", order_no: "0" };

export default function AdminCourseLessonsPage() {
  const { confirm } = useAppDialog();
  const { t } = useLanguage();
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [modal, setModal] = useState<"lesson" | "topic" | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [form, setForm] = useState<ItemForm | null>(null);
  const [quizTopic, setQuizTopic] = useState<Topic | null>(null);

  const loadCourse = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axiosClient.get(`/api/v1/courses/${courseId}`);
      setCourse(response.data.data);
    } catch {
      setError(t("admin.courseDetail.loadCourseError"));
    } finally {
      setLoading(false);
    }
  }, [courseId, t]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadCourse(), 0);
    return () => window.clearTimeout(timer);
  }, [loadCourse]);

  const loadTopics = useCallback(async (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setTopicsLoading(true);
    setError("");
    try {
      const response = await axiosClient.get(`/api/v1/admin/lessons/${lesson.id}/topics`);
      setTopics(response.data.data ?? []);
    } catch {
      setTopics([]);
      setError(t("admin.courseDetail.loadTopicsError"));
    } finally {
      setTopicsLoading(false);
    }
  }, [t]);

  const openLesson = (lesson?: Lesson) => {
    setEditingLesson(lesson ?? null);
    setEditingTopic(null);
    setModal("lesson");
    setError("");
    setForm(lesson
      ? { title: lesson.title ?? "", description: lesson.description ?? "", image: "", order_no: String(lesson.order_no ?? 0) }
      : { ...emptyForm, order_no: String((course?.lessons.length ?? 0) + 1) });
  };

  const openTopic = (topic?: Topic) => {
    setEditingTopic(topic ?? null);
    setEditingLesson(null);
    setModal("topic");
    setError("");
    setForm(topic
      ? { title: topic.title ?? "", description: topic.description ?? "", image: topic.image ?? "", order_no: String(topic.order_no ?? 0) }
      : { ...emptyForm, order_no: String(topics.length + 1) });
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!form) return;
    setSaving(true);
    setError("");
    setNotice("");
    const order_no = Number(form.order_no);
    try {
      if (modal === "lesson") {
        const payload = { title: form.title, description: form.description, order_no, ...(!editingLesson ? { course_id: courseId } : {}) };
        if (editingLesson) await axiosClient.put(`/api/v1/admin/lessons/${editingLesson.id}`, payload);
        else await axiosClient.post("/api/v1/admin/lessons", payload);
      } else {
        const payload = { title: form.title, description: form.description, image: form.image, order_no, ...(!editingTopic ? { lesson_id: selectedLesson?.id } : {}) };
        if (editingTopic) await axiosClient.put(`/api/v1/admin/topics/${editingTopic.id}`, payload);
        else await axiosClient.post("/api/v1/admin/topics", payload);
      }
      const currentLesson = selectedLesson;
      setModal(null);
      setForm(null);
      setNotice(t(modal === "lesson" ? "admin.courseDetail.savedLesson" : "admin.courseDetail.savedTopic"));
      await loadCourse();
      if (currentLesson && modal === "topic") await loadTopics(currentLesson);
    } catch {
      setError(t("admin.courseDetail.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const deleteLesson = async (lesson: Lesson) => {
    const description = t("admin.courseDetail.deleteLessonDescription").replace("{title}", lesson.title ?? "");
    if (!await confirm({ title: t("admin.courseDetail.deleteLessonTitle"), description, confirmLabel: t("admin.courseDetail.deleteLessonConfirm"), tone: "danger" })) return;
    try {
      await axiosClient.delete(`/api/v1/admin/lessons/${lesson.id}`);
      if (selectedLesson?.id === lesson.id) { setSelectedLesson(null); setTopics([]); }
      setNotice(t("admin.courseDetail.deleteLessonSuccess"));
      await loadCourse();
    } catch {
      setError(t("admin.courseDetail.deleteLessonError"));
    }
  };

  const deleteTopic = async (topic: Topic) => {
    const description = t("admin.courseDetail.deleteTopicDescription").replace("{title}", topic.title ?? "");
    if (!await confirm({ title: t("admin.courseDetail.deleteTopicTitle"), description, confirmLabel: t("admin.courseDetail.deleteTopicConfirm"), tone: "danger" })) return;
    try {
      await axiosClient.delete(`/api/v1/admin/topics/${topic.id}`);
      setNotice(t("admin.courseDetail.deleteTopicSuccess"));
      if (selectedLesson) await loadTopics(selectedLesson);
    } catch {
      setError(t("admin.courseDetail.deleteTopicError"));
    }
  };

  const jlptLevel = course?.title?.match(/N[1-5]/i)?.[0]?.toUpperCase();
  const closeForm = () => { setForm(null); setModal(null); };

  return (
    <div className="space-y-5">
      <Link href="/admin/content" className="inline-flex items-center gap-2 text-sm font-bold text-zinc-600 hover:text-[#b7152b]"><ArrowLeft size={16}/>{t("admin.courseDetail.back")}</Link>
      <header className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-[#b7152b]">{t("admin.courseDetail.editor")}</p><h2 className="mt-1 text-xl font-black">{course?.title ?? t("admin.courseDetail.courseFallback")}</h2><p className="mt-1 text-sm text-zinc-600">{t("admin.courseDetail.description")}</p></div><button type="button" onClick={() => openLesson()} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#b7152b] px-4 text-sm font-bold text-white"><Plus size={16}/>{t("admin.courseDetail.addLesson")}</button></header>
      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      {notice && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{notice}</div>}
      {loading ? <div className="rounded-xl border bg-white py-14 text-center text-zinc-600"><LoaderCircle aria-label={t("admin.courseDetail.loading")} className="mx-auto animate-spin"/></div> : <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.8fr)]">
        <section className="space-y-3" aria-label={t("admin.content.lessonsTopics")}>
          {course?.lessons?.length ? course.lessons.map((lesson) => <article key={lesson.id} className={`rounded-xl border bg-white p-4 ${selectedLesson?.id === lesson.id ? "border-red-300" : "border-zinc-200"}`}>
            <div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-sm font-black text-[#b7152b]">{lesson.order_no ?? "—"}</span><div className="min-w-0 flex-1"><h3 className="font-extrabold">{lesson.title}</h3><p className="mt-1 text-xs text-zinc-600">{lesson.quiz_count} {t("admin.courseDetail.quizCount")} · {lesson.description || t("admin.courseDetail.noDescription")}</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => void loadTopics(lesson)} className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-[#b7152b]">{t("admin.courseDetail.topic")}</button><button type="button" onClick={() => openLesson(lesson)} className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-bold"><Pencil size={12}/>{t("admin.courseDetail.edit")}</button><button type="button" onClick={() => void deleteLesson(lesson)} className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-100"><Trash2 size={12}/>{t("admin.courseDetail.delete")}</button></div></div></div>
          </article>) : <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-600">{t("admin.courseDetail.noLessons")}</div>}
        </section>
        <section className="h-fit rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-[#b7152b]">{t("admin.courseDetail.lessonContent")}</p><h3 className="mt-1 font-extrabold">{selectedLesson?.title ?? t("admin.courseDetail.selectLesson")}</h3></div>{selectedLesson && <button type="button" onClick={() => openTopic()} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#b7152b] px-3 py-2 text-xs font-bold text-white"><Plus size={14}/>{t("admin.courseDetail.addTopic")}</button>}</div>
          {topicsLoading ? <div className="py-12 text-center text-zinc-600"><LoaderCircle aria-label={t("admin.courseDetail.loading")} className="mx-auto animate-spin"/></div> : !selectedLesson ? <p className="mt-4 rounded-xl bg-zinc-50 p-4 text-sm text-zinc-600">{t("admin.courseDetail.chooseTopicHint")}</p> : topics.length === 0 ? <p className="mt-4 rounded-xl bg-zinc-50 p-4 text-sm text-zinc-600">{t("admin.courseDetail.noTopics")}</p> : <div className="mt-4 space-y-3">{topics.map((topic) => <article key={topic.id} className="rounded-xl border border-zinc-100 p-4"><div className="flex items-start justify-between gap-2"><div><div className="flex items-center gap-2"><BookOpen size={14} className="text-[#b7152b]"/><h4 className="text-sm font-bold">{topic.title}</h4></div><p className="mt-1 text-xs text-zinc-600">{topic.description || t("admin.courseDetail.noDescription")}</p></div><span className="text-xs text-zinc-600">#{topic.order_no}</span></div><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => setQuizTopic(topic)} className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800"><ListChecks size={13}/>{t("admin.courseDetail.manageQuiz")}</button><button type="button" onClick={() => openTopic(topic)} className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-bold"><Pencil size={12}/>{t("admin.courseDetail.editTopic")}</button><button type="button" onClick={() => void deleteTopic(topic)} className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-100"><Trash2 size={12}/>{t("admin.courseDetail.delete")}</button></div><TopicVocabularyManager topicId={topic.id} jlptLevel={jlptLevel} onError={setError} onNotice={setNotice}/></article>)}</div>}
        </section>
      </div>}
      {quizTopic && <QuizManagerDialog topicId={quizTopic.id} topicTitle={quizTopic.title ?? t("admin.courseDetail.topic")} onClose={() => setQuizTopic(null)} onSaved={() => void loadCourse()}/>}
      {form && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4" onClick={closeForm}><form onSubmit={(event) => void save(event)} onClick={(event) => event.stopPropagation()} className="w-full max-w-xl rounded-xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between"><h3 className="text-lg font-black">{editingLesson ? t("admin.courseDetail.editLesson") : editingTopic ? t("admin.courseDetail.editTopicTitle") : modal === "lesson" ? t("admin.courseDetail.createLesson") : t("admin.courseDetail.createTopic")}</h3><button type="button" aria-label={t("admin.quiz.close")} onClick={closeForm} className="rounded-lg p-2 hover:bg-zinc-100"><X size={18}/></button></div>
        <div className="mt-5 space-y-4"><label className="block space-y-1.5 text-xs font-bold text-zinc-600">{t("admin.courseDetail.name")}<input required minLength={3} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm font-medium text-zinc-900"/></label><label className="block space-y-1.5 text-xs font-bold text-zinc-600">{t("admin.courseDetail.descriptionField")}<textarea rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="w-full rounded-xl border border-zinc-200 p-3 text-sm font-medium text-zinc-900"/></label>{modal === "topic" && <label className="block space-y-1.5 text-xs font-bold text-zinc-600">{t("admin.courseDetail.imageUrl")}<input value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value })} className="h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm font-medium text-zinc-900"/></label>}<label className="block space-y-1.5 text-xs font-bold text-zinc-600">{t("admin.courseDetail.order")}<input required min="0" type="number" value={form.order_no} onChange={(event) => setForm({ ...form, order_no: event.target.value })} className="h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm font-medium text-zinc-900"/></label></div>
        {error && <p role="alert" className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={closeForm} className="rounded-xl px-4 py-2.5 text-sm font-bold text-zinc-600">{t("admin.courseDetail.cancel")}</button><button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#b7152b] px-5 py-2.5 text-sm font-bold text-white">{saving && <LoaderCircle size={15} className="animate-spin"/>}{t("admin.courseDetail.save")}</button></div>
      </form></div>}
    </div>
  );
}
