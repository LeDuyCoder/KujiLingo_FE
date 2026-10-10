"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Award, BookOpen, Flame, LoaderCircle, Pencil, Plus, Trophy, X, Zap } from "lucide-react";
import { axiosClient } from "@/shared/api/axiosClient";
import { Select } from "@/shared/components/ui/Select";
import { useLanguage } from "@/shared/i18n/language";

type Achievement = { id: string; title: string; description: string; icon: string; type: "STREAK"|"EXP"|"VOCAB_MASTER"|"QUIZ_PERFECT"; condition_value: number; reward_exp: number; is_unlocked?: boolean };
type FormData = { title: string; description: string; icon: string; type: Achievement["type"]; condition_value: string; reward_exp: string };
const blank: FormData = { title: "", description: "", icon: String.fromCodePoint(0x1f3c6), type: "STREAK", condition_value: "1", reward_exp: "0" };

function getFallbackIcon(type: Achievement["type"]) {
  switch (type) {
    case "STREAK": return <Flame size={25} className="text-amber-600" />;
    case "EXP": return <Zap size={25} className="text-violet-600" />;
    case "VOCAB_MASTER": return <BookOpen size={25} className="text-blue-600" />;
    case "QUIZ_PERFECT": return <Trophy size={25} className="text-amber-600" />;
    default: return <Award size={25} className="text-amber-600" />;
  }
}

function AchievementIcon({ icon, type }: Pick<Achievement, "icon" | "type">) {
  const [failedIcon, setFailedIcon] = useState("");
  const trimmedIcon = icon.trim();
  const imageLike = /\.(png|jpe?g|webp|gif|svg)(?:[?#].*)?$/i.test(trimmedIcon);
  const imageSource = /^(https?:\/\/|data:image\/|\/)/i.test(trimmedIcon) ? trimmedIcon : null;
  const showImage = Boolean(imageSource && failedIcon !== trimmedIcon);
  const fallback = imageLike || imageSource || !trimmedIcon ? getFallbackIcon(type) : icon;

  return (
    <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-amber-50 text-2xl">
      <span className={showImage ? "invisible" : ""}>{fallback}</span>
      {showImage && (
          <img src={imageSource!} alt="" onError={() => setFailedIcon(trimmedIcon)} className="absolute inset-0 h-full w-full object-contain p-1" />
      )}
    </span>
  );
}

export default function AdminAchievementsPage() {
  const { t } = useLanguage();
  const typeLabels: Record<Achievement["type"], string> = {
    STREAK: t("admin.achievements.type.streak"),
    EXP: t("admin.achievements.type.exp"),
    VOCAB_MASTER: t("admin.achievements.type.vocab"),
    QUIZ_PERFECT: t("admin.achievements.type.quiz"),
  };
  const [items, setItems] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<Achievement | null>(null);
  const [form, setForm] = useState<FormData | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { const response = await axiosClient.get("/api/v1/achievements/catalog", { params: { page: 1, limit: 50 } }); setItems(response.data.data?.items ?? []); }
    catch { setError(t("admin.achievements.loadError")); }
    finally { setLoading(false); }
  }, [t]);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);

  const open = (item?: Achievement) => { setEditing(item??null); setNotice(""); setError(""); setForm(item?{title:item.title,description:item.description,icon:item.icon,type:item.type,condition_value:String(item.condition_value),reward_exp:String(item.reward_exp)}:{...blank}); };
  const save = async (event: FormEvent) => {
    event.preventDefault(); if(!form)return; setSaving(true);setError("");
    const payload={title:form.title,description:form.description,icon:form.icon,type:form.type,condition_value:Number(form.condition_value),reward_exp:Number(form.reward_exp)};
    try {
      if(editing) await axiosClient.patch(`/api/v1/achievements/${editing.id}`,payload);
      else await axiosClient.post("/api/v1/achievements",payload);
      setForm(null);setNotice(editing ? t("admin.achievements.updated") : t("admin.achievements.created"));await load();
    } catch(e:unknown) {const message=(e as {response?:{data?:{error?:{message?:string}}}}).response?.data?.error?.message;setError(message || t("admin.achievements.saveError"));}
    finally{setSaving(false);}
  };

  return <div className="space-y-5"><div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-2xl font-black tracking-tight text-zinc-950">{t("admin.achievements")}</h2><p className="mt-1 text-sm text-zinc-600">{t("admin.achievements.description")}</p></div><button onClick={()=>open()} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#b7152b] px-4 text-sm font-bold text-white"><Plus size={17}/>{t("admin.achievements.create")}</button></div>
    {notice&&<div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{notice}</div>}{error&&<div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
    {loading?<div className="rounded-xl border bg-white py-16 text-center text-zinc-600"><LoaderCircle className="mx-auto animate-spin"/></div>:<div className="grid gap-3 lg:grid-cols-2">{items.map((item)=><article key={item.id} className="flex items-start gap-4 rounded-2xl border border-zinc-200 bg-white p-5"><AchievementIcon icon={item.icon} type={item.type}/><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div><h3 className="font-extrabold text-zinc-900">{item.title}</h3><p className="mt-1 text-xs text-zinc-600">{typeLabels[item.type]} · {t("admin.achievements.condition")} {item.condition_value}</p></div><span className="shrink-0 rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-bold text-violet-700">{item.reward_exp} EXP</span></div><p className="mt-2 text-sm text-zinc-600">{item.description}</p><button onClick={()=>open(item)} className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-bold hover:bg-zinc-50"><Pencil size={13}/>{t("admin.achievements.edit")}</button></div></article>)}</div>}
    {form&&<div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4" onClick={()=>setForm(null)}><form onSubmit={(e)=>void save(e)} onClick={(e)=>e.stopPropagation()} className="w-full max-w-xl rounded-xl bg-white p-6 shadow-2xl"><div className="flex items-center justify-between"><h3 className="text-lg font-black">{editing ? t("admin.achievements.updateTitle") : t("admin.achievements.createTitle")}</h3><button type="button" onClick={()=>setForm(null)} className="rounded-lg p-2 hover:bg-zinc-100"><X size={18}/></button></div><div className="mt-5 grid gap-4 sm:grid-cols-2">{([["title",t("admin.achievements.title")],["icon",t("admin.achievements.icon")],["description",t("admin.achievements.descriptionField")],["condition_value",t("admin.achievements.conditionValue")],["reward_exp",t("admin.achievements.reward")]] as const).map(([key,label])=><label key={key} className={`space-y-1.5 text-xs font-bold text-zinc-600 ${key==="description"?"sm:col-span-2":""}`}>{label}{key==="description"?<textarea required rows={3} value={form[key]} onChange={(e)=>setForm({...form,[key]:e.target.value})} className="w-full rounded-xl border border-zinc-200 p-3 text-sm font-medium text-zinc-900"/>:<input required type={key==="condition_value"||key==="reward_exp"?"number":"text"} min={key==="reward_exp"?"0":key==="condition_value"?"1":undefined} value={form[key]} onChange={(e)=>setForm({...form,[key]:e.target.value})} className="h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm font-medium text-zinc-900"/>}</label>)}<label className="space-y-1.5 text-xs font-bold text-zinc-600">{t("admin.achievements.type")}<Select value={form.type} onValueChange={(value)=>setForm({...form,type:value as Achievement["type"]})} ariaLabel={t("admin.achievements.type")} options={Object.entries(typeLabels).map(([value,label])=>({value,label}))} className="h-10 w-full"/></label></div><p className="mt-3 text-xs text-zinc-600">{t("admin.achievements.changeHint")}</p>{error&&<p className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}<div className="mt-6 flex justify-end gap-2"><button type="button" onClick={()=>setForm(null)} className="rounded-xl px-4 py-2.5 text-sm font-bold text-zinc-600">{t("admin.achievements.cancel")}</button><button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#b7152b] px-5 py-2.5 text-sm font-bold text-white">{saving&&<LoaderCircle size={15} className="animate-spin"/>}{t("admin.achievements.save")}</button></div></form></div>}</div>;
}
