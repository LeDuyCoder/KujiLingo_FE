/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useState } from "react";
import { LoaderCircle, Search, ChevronLeft, ChevronRight, X, Shield, Flame, Star, BookOpen } from "lucide-react";
import { axiosClient } from "@/shared/api/axiosClient";
import { Select } from "@/shared/components/ui/Select";
import { useLanguage } from "@/shared/i18n/language";

type AdminUser = { id: string; email: string | null; display_name: string | null; avatar: string | null; level: number | null; exp: number | null; streak: number | null; role: string; status: string | null; created_at: string };
type UserDetail = AdminUser & { total_reviews: number; pvp_matches: number; pvp_rating: number };
type Meta = { page: number; limit: number; total: number; total_pages: number };

export default function AdminUsersPage() {
  const { language, t } = useLanguage();
  const statusLabel: Record<string, string> = {
    active: t("admin.users.active"),
    suspended: t("admin.users.suspended"),
    banned: t("admin.users.banned"),
    pending_verification: t("admin.users.pending"),
  };
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [meta, setMeta] = useState<Meta>({ page: 1, limit: 20, total: 0, total_pages: 1 });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<UserDetail | null>(null);

  const load = useCallback(async (page = 1) => {
    setLoading(true); setError("");
    try {
      const response = await axiosClient.get("/api/v1/admin/users", { params: { page, limit: 20, search: search || undefined, status: status || undefined, role: role || undefined } });
      setUsers(response.data.data ?? []); setMeta(response.data.meta);
    } catch {
      setError(t("admin.users.loadError"));
    } finally { setLoading(false); }
  }, [search, status, role, t]);

  useEffect(() => { const timer = window.setTimeout(() => void load(1), 250); return () => window.clearTimeout(timer); }, [load]);

  useEffect(() => {
    if (!selected) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [selected]);

  const changeUser = async (user: AdminUser, field: "status" | "role", value: string) => {
    setSaving(user.id); setError("");
    try {
      await axiosClient.put(`/api/v1/admin/users/${user.id}/${field}`, { [field]: value });
      await load(meta.page);
      if (selected?.id === user.id) {
        const response = await axiosClient.get(`/api/v1/admin/users/${user.id}`);
        setSelected(response.data.data);
      }
    } catch (e: unknown) {
      const message = (e as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message;
      setError(message || t("admin.users.updateError"));
    } finally { setSaving(null); }
  };

  const openUser = async (id: string) => {
    try { const response = await axiosClient.get(`/api/v1/admin/users/${id}`); setSelected(response.data.data); }
    catch { setError(t("admin.users.profileError")); }
  };

  const detailPanel = selected ? (
    <section aria-labelledby="user-detail-title" className="bg-white p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-red-50 font-bold text-[#b7152b]">
          {selected.avatar ? <img src={selected.avatar} alt="" className="h-full w-full object-cover" /> : (selected.display_name || selected.email || t("admin.users.emailMissing")).slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <h3 id="user-detail-title" className="truncate text-lg font-black text-zinc-950">{selected.display_name || t("admin.users.nameMissing")}</h3>
          <p className="mt-1 break-all text-sm text-zinc-600">{selected.email || t("admin.users.emailMissing")}</p>
        </div>
        <button type="button" autoFocus aria-label={t("admin.users.closeDetails")} onClick={() => setSelected(null)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b7152b] xl:hidden"><X size={19}/></button>
      </div>
      <dl className="mt-6 grid grid-cols-2 gap-2">
        {[[t("admin.users.level"),selected.level??1,Star],[t("admin.users.streak"),selected.streak??0,Flame],[t("admin.users.reviews"),selected.total_reviews,BookOpen],[t("admin.users.pvp"),selected.pvp_matches,Shield]].map(([label,value,Icon])=>{const I=Icon as typeof Star;return <div key={String(label)} className="rounded-xl bg-zinc-50 p-3"><dt className="flex items-center gap-2 text-xs font-medium text-zinc-600"><I size={15} className="text-[#b7152b]"/>{String(label)}</dt><dd className="mt-2 text-xl font-black tabular-nums text-zinc-950">{String(value ?? 0)}</dd></div>})}
      </dl>
      <dl className="mt-5 space-y-1 text-sm">
        <div className="flex justify-between gap-4 rounded-lg px-2 py-3"><dt className="text-zinc-600">{t("admin.users.role")}</dt><dd className="font-semibold text-zinc-900">{selected.role === "admin" ? t("admin.role") : t("admin.users.permissions")}</dd></div>
        <div className="flex justify-between gap-4 rounded-lg px-2 py-3"><dt className="text-zinc-600">{t("admin.users.status")}</dt><dd className="font-semibold text-zinc-900">{statusLabel[selected.status || "active"]}</dd></div>
        <div className="flex justify-between gap-4 rounded-lg px-2 py-3"><dt className="text-zinc-600">{t("admin.users.created")}</dt><dd className="font-semibold text-zinc-900">{selected.created_at ? new Date(selected.created_at).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US") : "—"}</dd></div>
        <div className="rounded-lg px-2 py-3"><dt className="text-xs text-zinc-600">{t("admin.users.accountId")}</dt><dd className="mt-1 break-all font-mono text-xs text-zinc-800">{selected.id}</dd></div>
      </dl>
    </section>
   ) : <div className="flex min-h-64 items-center justify-center bg-white px-6 text-center text-sm leading-6 text-zinc-600">{t("admin.users.selectAccount")}</div>;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-2xl font-black tracking-tight text-zinc-950">{t("admin.users")}</h1><p className="mt-1 text-sm text-zinc-600">{t("admin.users.description")}</p></div><p className="text-sm font-semibold tabular-nums text-zinc-700">{meta.total.toLocaleString(language === "vi" ? "vi-VN" : "en-US")} {t("admin.users.accountCount")}</p></div>
      <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <label className="relative min-w-0 flex-1"><span className="sr-only">{t("admin.users.searchLabel")}</span><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("admin.users.searchPlaceholder")} className="h-11 w-full rounded-lg border border-zinc-300 pl-10 pr-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-600 focus:border-[#b7152b] focus-visible:ring-0" /></label>
        <Select value={status} onValueChange={setStatus} ariaLabel={t("admin.users.filterStatus")} options={[{value:"",label:t("admin.users.anyStatus")},...Object.entries(statusLabel).map(([value,label])=>({value,label}))]} className="h-11 min-w-[170px]" />
        <Select value={role} onValueChange={setRole} ariaLabel={t("admin.users.filterRole")} options={[{value:"",label:t("admin.users.anyRole")},{value:"user",label:t("admin.users.permissions")},{value:"admin",label:t("admin.role")}]} className="h-11 min-w-[150px]" />
      </div>
      {error && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">{error}</div>}
      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_340px] 2xl:grid-cols-[minmax(0,1fr)_380px]">
        <section aria-label={t("admin.users.listLabel")} className="min-w-0 overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="text-xs font-bold text-zinc-700"><tr><th scope="col" className="px-3 py-3">{t("admin.users.account")}</th><th scope="col" className="px-3 py-3">{t("admin.users.progress")}</th><th scope="col" className="px-3 py-3">{t("admin.users.status")}</th><th scope="col" className="px-3 py-3">{t("admin.users.permissions")}</th><th scope="col" className="px-3 py-3">{t("admin.users.created")}</th></tr></thead><tbody className="divide-y divide-zinc-100">
            {loading ? <tr><td colSpan={5} className="py-16 text-center text-zinc-600"><LoaderCircle aria-label={t("admin.users.listLabel")} className="mx-auto animate-spin" /></td></tr> : users.length === 0 ? <tr><td colSpan={5} className="py-12 text-center text-zinc-600">{t("admin.users.searchEmpty")}</td></tr> : users.map((u) => <tr key={u.id} aria-selected={selected?.id === u.id} className="group transition-colors hover:bg-zinc-50 [&>td]:transition-colors">
              <td className={`px-3 py-3 ${selected?.id===u.id?"!bg-red-50/70":""}`}><button type="button" aria-pressed={selected?.id === u.id} onClick={() => void openUser(u.id)} className="flex min-h-11 w-full items-center gap-3 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#b7152b]"><span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-red-50 font-bold text-[#b7152b]">{u.avatar ? <img src={u.avatar} alt="" className="h-full w-full object-cover" /> : (u.display_name || u.email || "?").slice(0,1).toUpperCase()}</span><span className="min-w-0"><span className="block truncate font-bold text-zinc-900">{u.display_name || "Chưa đặt tên"}</span><span className="block max-w-48 truncate text-xs text-zinc-600">{u.email || "Không có email"}</span></span></button></td>
              <td className={`whitespace-nowrap px-3 py-3 text-zinc-800 ${selected?.id===u.id?"!bg-red-50/70":""}`}>Lv. {u.level ?? 1}<span className="block text-xs text-zinc-600">{u.exp ?? 0} EXP</span></td>
              <td className={`px-3 py-3 ${selected?.id===u.id?"!bg-red-50/70":""}`}><Select disabled={saving===u.id} value={u.status || "active"} onValueChange={(value) => void changeUser(u,"status",value)} ariaLabel={`Trạng thái ${u.display_name || u.email || "người dùng"}`} options={Object.entries(statusLabel).map(([value,label])=>({value,label}))} className="h-9 min-w-[145px] rounded-md px-2 text-xs" /></td>
              <td className={`px-3 py-3 ${selected?.id===u.id?"!bg-red-50/70":""}`}><Select disabled={saving===u.id} value={u.role} onValueChange={(value) => void changeUser(u,"role",value)} ariaLabel={`Quyền ${u.display_name || u.email || "người dùng"}`} options={[{value:"user",label:t("admin.users.permissions")},{value:"admin",label:t("admin.role")}]} className="h-9 min-w-[130px] rounded-md px-2 text-xs" /></td>
              <td className={`whitespace-nowrap px-3 py-3 text-xs text-zinc-700 ${selected?.id===u.id?"!bg-red-50/70":""}`}>{u.created_at ? new Date(u.created_at).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US") : "—"}</td>
            </tr>)}
          </tbody></table></div>
          <div className="flex items-center justify-between px-4 py-3 text-xs text-zinc-700"><span>{t("admin.users.page")} {meta.page} / {meta.total_pages}</span><div className="flex gap-2"><button type="button" aria-label={t("admin.users.previous")} disabled={meta.page<=1||loading} onClick={()=>void load(meta.page-1)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-300 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b7152b] disabled:opacity-40"><ChevronLeft size={16}/></button><button type="button" aria-label={t("admin.users.next")} disabled={meta.page>=meta.total_pages||loading} onClick={()=>void load(meta.page+1)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-300 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b7152b] disabled:opacity-40"><ChevronRight size={16}/></button></div></div>
        </section>
        <aside aria-label={t("admin.users.detailsLabel")} className="hidden min-w-0 self-start overflow-y-auto rounded-2xl bg-white shadow-sm xl:sticky xl:top-6 xl:block xl:max-h-[calc(100dvh-8rem)]">{detailPanel}</aside>
      </div>
      {selected && <div className="fixed inset-0 z-[70] flex justify-end bg-zinc-950/40 p-2 sm:p-3 xl:hidden" onClick={() => setSelected(null)}><aside role="dialog" aria-modal="true" aria-labelledby="user-detail-title" onClick={(e)=>e.stopPropagation()} className="h-full w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-xl">{detailPanel}</aside></div>}
    </div>
  );
}
