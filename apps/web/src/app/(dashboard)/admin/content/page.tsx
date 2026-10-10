"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { BookOpen, LoaderCircle, Pencil, Plus, RotateCcw, Trash2, X } from "lucide-react";
import { axiosClient } from "@/shared/api/axiosClient";
import { useAppDialog } from "@/shared/components/ui/AppDialogProvider";
import { useLanguage } from "@/shared/i18n/language";
import { useLanguage } from "@/shared/i18n/language";

type Course = { id: string; title: string | null; description: string | null; image: string | null; order_no: number | null; lesson_count: number; deleted_at?: string | null };
type CourseForm = { title: string; description: string; image: string; order_no: string };
const blank: CourseForm = { title: "", description: "", image: "", order_no: "0" };

export default function AdminContentPage() {
  const { confirm } = useAppDialog();
  const { language, t } = useLanguage();
  const [courses, setCourses] = useState<Course[]>([]);
  const [archived, setArchived] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<Course | null>(null);
  const [form, setForm] = useState<CourseForm | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [response, archivedResponse] = await Promise.all([
        axiosClient.get("/api/v1/courses", { params: { page: 1, limit: 50 } }),
        axiosClient.get("/api/v1/admin/courses/archived"),
      ]);
      setCourses(response.data.data ?? []); setArchived(archivedResponse.data.data ?? []);
    }
    catch { setError(t("admin.content.loadError")); }
    finally { setLoading(false); }
  }, [t]);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);

  const open = (course?: Course) => {
    setError(""); setNotice(""); setEditing(course ?? null);
    setForm(course ? { title: course.title ?? "", description: course.description ?? "", image: course.image ?? "", order_no: String(course.order_no ?? 0) } : { ...blank });
  };

  const save = async (event: FormEvent) => {
    event.preventDefault(); if (!form) return;
    setSaving(true); setError("");
    const payload = { title: form.title.trim(), description: form.description || undefined, image: form.image || "", order_no: Number(form.order_no) };
    try {
      if (editing) await axiosClient.put(`/api/v1/admin/courses/${editing.id}`, payload);
      else await axiosClient.post("/api/v1/admin/courses", payload);
      setForm(null); setNotice(editing ? t("admin.content.updateSuccess") : t("admin.content.createSuccess")); await load();
    } catch (e: unknown) {
      const message = (e as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message;
      setError(message || t("admin.content.saveError"));
    } finally { setSaving(false); }
  };

  const remove = async (course: Course) => {
    if (!await confirm({ title: t("admin.content.hideTitle"), description: t("admin.content.hideDescription").replace("{title}", course.title ?? ""), confirmLabel: t("admin.content.hideConfirm"), tone: "danger" })) return;
    try { await axiosClient.delete(`/api/v1/admin/courses/${course.id}`); setNotice(t("admin.content.hideSuccess")); await load(); }
    catch (e: unknown) { const message = (e as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message; setError(message || t("admin.content.hideError")); }
  };

  const restore = async (course: Course) => {
    try { await axiosClient.post(`/api/v1/admin/courses/${course.id}/restore`); setNotice(t("admin.content.hideSuccess")); await load(); }
    catch { setError(t("admin.content.loadError")); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-2xl font-black tracking-tight text-zinc-950">{t("admin.courses")}</h2><p className="mt-1 text-sm text-zinc-600">{t("admin.content.description")}</p></div><div className="flex gap-2"><Link href="/admin/library" className="inline-flex h-10 items-center justify-center rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-bold text-zinc-700">{t("admin.library")}</Link><button onClick={()=>open()} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#b7152b] px-4 text-sm font-bold text-white"><Plus size={17}/>{t("admin.content.create")}</button></div></div>
      {notice&&<div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{notice}</div>}{error&&<div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      {loading?<div className="rounded-xl border bg-white py-16 text-center text-zinc-600"><LoaderCircle className="mx-auto animate-spin"/></div>:<div className="grid gap-4 lg:grid-cols-2">{courses.map((course)=><article key={course.id} className="rounded-2xl border border-zinc-200 bg-white p-5"><div className="flex gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-[#b7152b]"><BookOpen size={22}/></div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><div><h3 className="font-extrabold text-zinc-900">{course.title||t("admin.content.courseMissing")}</h3><p className="mt-1 text-xs text-zinc-600">{t("admin.content.order")} {course.order_no??"—"} · {course.lesson_count} {t("admin.content.lessonCount")}</p></div><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">{t("admin.content.visible")}</span></div><p className="mt-3 line-clamp-2 text-sm text-zinc-600">{course.description||t("admin.content.noDescription")}</p><div className="mt-4 flex flex-wrap gap-2"><Link href={`/admin/content/${course.id}`} className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-[#b7152b] hover:bg-red-100"><BookOpen size={13}/>{t("admin.content.lessonsTopics")}</Link><button onClick={()=>open(course)} className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-bold hover:bg-zinc-50"><Pencil size={13}/>{t("admin.content.edit")}</button><button onClick={()=>void remove(course)} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-100"><Trash2 size={13}/>{t("admin.content.hideConfirm")}</button></div></div></div></article>)}</div>}
      {archived.length>0&&<details className="rounded-2xl border border-zinc-200 bg-white p-5"><summary className="cursor-pointer text-sm font-extrabold text-zinc-800">{t("admin.content.archived")} <span className="ml-1 text-zinc-600">({archived.length})</span></summary><div className="mt-4 space-y-2">{archived.map((course)=><div key={course.id} className="flex flex-col gap-3 rounded-xl border border-zinc-100 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold text-zinc-800">{course.title}</p><p className="mt-1 text-xs text-zinc-600">{t("admin.content.hiddenOn")} {course.deleted_at?new Date(course.deleted_at).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US"):""}</p></div><button onClick={()=>void restore(course)} className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-zinc-200 px-3 text-xs font-bold hover:bg-zinc-50"><RotateCcw size={13}/>{t("admin.content.restore")}</button></div>)}</div></details>}
      {form&&<div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4" onClick={()=>setForm(null)}><form onSubmit={(e)=>void save(e)} onClick={(e)=>e.stopPropagation()} className="w-full max-w-xl rounded-xl bg-white p-6 shadow-2xl"><div className="flex items-center justify-between"><h3 className="text-lg font-black">{editing ? t("admin.content.editTitle") : t("admin.content.createTitle")}</h3><button type="button" onClick={()=>setForm(null)} className="rounded-lg p-2 hover:bg-zinc-100"><X size={18}/></button></div><div className="mt-5 space-y-4">{([["title",t("admin.content.name")],["description",t("admin.content.descriptionField")],["image",t("admin.content.image")],["order_no",t("admin.content.order")]] as const).map(([key,label])=><label key={key} className="block space-y-1.5 text-xs font-bold text-zinc-600">{label}{key==="description"?<textarea rows={3} value={form[key]} onChange={(e)=>setForm({...form,[key]:e.target.value})} className="w-full rounded-xl border border-zinc-200 p-3 text-sm font-medium text-zinc-900 outline-none focus:border-red-300"/>:<input required={key==="title"} min={key==="order_no"?"0":undefined} type={key==="order_no"?"number":"text"} value={form[key]} onChange={(e)=>setForm({...form,[key]:e.target.value})} className="h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm font-medium text-zinc-900 outline-none focus:border-red-300"/>}</label>)}</div>{error&&<p className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}<div className="mt-6 flex justify-end gap-2"><button type="button" onClick={()=>setForm(null)} className="rounded-xl px-4 py-2.5 text-sm font-bold text-zinc-600">{t("admin.content.cancel")}</button><button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#b7152b] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">{saving&&<LoaderCircle size={15} className="animate-spin"/>}Lưu</button></div></form></div>}
    </div>
  );
}
