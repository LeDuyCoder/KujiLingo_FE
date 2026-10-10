"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, LoaderCircle, Search } from "lucide-react";
import { axiosClient } from "@/shared/api/axiosClient";
import { useLanguage } from "@/shared/i18n/language";

type Entry = { id: string; admin_id: string; admin_name: string; action: string; entity_id: string | null; before_state: unknown; after_state: unknown; created_at: string };
type Meta = { page: number; total: number; total_pages: number };
const stateText = (value: unknown) => value ? JSON.stringify(value, null, 2) : "—";

export default function AdminAuditPage() {
  const { language, t } = useLanguage();
  const [items, setItems] = useState<Entry[]>([]);
  const [meta, setMeta] = useState<Meta>({ page: 1, total: 0, total_pages: 1 });
  const [action, setAction] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (page = 1) => {
    setLoading(true); setError("");
    try {
      const response = await axiosClient.get("/api/v1/admin/audit-logs", { params: { page, limit: 30, action: action || undefined, start_date: startDate || undefined, end_date: endDate || undefined } });
      setItems(response.data.data ?? []); setMeta(response.data.meta);
    } catch { setError(t("admin.audit.loadError")); }
    finally { setLoading(false); }
  }, [action, startDate, endDate, t]);

  useEffect(() => { const timer = window.setTimeout(() => void load(1), 0); return () => window.clearTimeout(timer); }, [load]);

  return (
    <div className="space-y-5">
      <div><h2 className="text-2xl font-black tracking-tight text-zinc-950">{t("admin.audit")}</h2><p className="mt-1 text-sm text-zinc-600">{t("admin.audit.description")}</p></div>
      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 md:flex-row md:items-center"><label className="relative min-w-56 flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"/><input value={action} onChange={(e)=>setAction(e.target.value)} placeholder={t("admin.audit.actionFilter")} className="h-10 w-full rounded-lg border border-zinc-200 pl-9 pr-3 text-sm outline-none focus:border-red-300"/></label><label className="text-xs font-semibold text-zinc-600">{t("admin.audit.from")}  <input type="date" value={startDate} onChange={(e)=>setStartDate(e.target.value)} className="ml-2 h-10 rounded-lg border border-zinc-200 px-2 text-sm text-zinc-800"/></label><label className="text-xs font-semibold text-zinc-600">{t("admin.audit.to")}  <input type="date" value={endDate} onChange={(e)=>setEndDate(e.target.value)} className="ml-2 h-10 rounded-lg border border-zinc-200 px-2 text-sm text-zinc-800"/></label></div>
      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-600"><tr><th className="px-4 py-4">{t("admin.audit.time")}</th><th className="px-4 py-4">{t("admin.audit.admin")}</th><th className="px-4 py-4">{t("admin.audit.action")}</th><th className="px-4 py-4">{t("admin.audit.entity")}</th><th className="px-4 py-4">{t("admin.audit.details")}</th></tr></thead><tbody className="divide-y divide-zinc-100">{loading?<tr><td colSpan={5} className="py-14 text-center text-zinc-600"><LoaderCircle className="mx-auto animate-spin"/></td></tr>:items.length===0?<tr><td colSpan={5} className="py-12 text-center text-zinc-600">{t("admin.audit.empty")}</td></tr>:items.map((entry)=><tr key={entry.id} className="align-top"><td className="whitespace-nowrap px-5 py-4 text-xs text-zinc-600">{new Date(entry.created_at).toLocaleString(language === "vi" ? "vi-VN" : "en-US")}</td><td className="px-4 py-4 font-semibold">{entry.admin_name}</td><td className="px-4 py-4"><span className="rounded-md bg-zinc-100 px-2 py-1 font-mono text-xs text-zinc-700">{entry.action}</span></td><td className="max-w-44 truncate px-4 py-4 font-mono text-xs text-zinc-600" title={entry.entity_id ?? ""}>{entry.entity_id ?? "—"}</td><td className="px-4 py-4"><details className="max-w-lg"><summary className="cursor-pointer text-xs font-bold text-[#b7152b]">{t("admin.audit.stateDiff")}</summary><div className="mt-3 grid gap-2 lg:grid-cols-2"><pre className="max-h-64 overflow-auto rounded-lg bg-zinc-50 p-3 text-[11px] text-zinc-600">{stateText(entry.before_state)}</pre><pre className="max-h-64 overflow-auto rounded-lg bg-zinc-50 p-3 text-[11px] text-zinc-600">{stateText(entry.after_state)}</pre></div></details></td></tr>)}</tbody></table></div><div className="flex items-center justify-between border-t border-zinc-100 px-4 py-3 text-xs text-zinc-600"><span>{meta.total.toLocaleString(language === "vi" ? "vi-VN" : "en-US")} {t("admin.audit.recordCount")} · {t("admin.users.page")} {meta.page}/{meta.total_pages}</span><div className="flex gap-2"><button aria-label={t("admin.users.previous")} disabled={meta.page<=1||loading} onClick={()=>void load(meta.page-1)} className="rounded-lg border p-2 disabled:opacity-40"><ChevronLeft size={16}/></button><button aria-label={t("admin.users.next")} disabled={meta.page>=meta.total_pages||loading} onClick={()=>void load(meta.page+1)} className="rounded-lg border p-2 disabled:opacity-40"><ChevronRight size={16}/></button></div></div></div>
    </div>
  );
}
