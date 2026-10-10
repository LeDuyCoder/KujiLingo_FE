/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Check, ChevronLeft, ChevronRight, LoaderCircle, Plus, Search, Tag, Gem, Pencil, EyeOff, X } from "lucide-react";
import { axiosClient } from "@/shared/api/axiosClient";
import { Select } from "@/shared/components/ui/Select";
import { useAppDialog } from "@/shared/components/ui/AppDialogProvider";
import { useLanguage } from "@/shared/i18n/language";

type Tab = "items" | "packages" | "promotions" | "banners" | "transactions" | "sales";
type Row = Record<string, unknown> & { id: string };
type Field = { key: string; label: string; type?: "text" | "number" | "textarea" | "select" | "checkbox" | "datetime-local"; required?: boolean; options?: [string, string][] };
type FormState = Record<string, string | boolean>;
const tabs: { id: Tab; label: string }[] = [
  { id: "items", label: "admin.shop.tab.items" },
  { id: "packages", label: "admin.shop.tab.packages" },
  { id: "promotions", label: "admin.shop.tab.promotions" },
  { id: "banners", label: "admin.shop.tab.banners" },
  { id: "transactions", label: "admin.shop.tab.transactions" },
  { id: "sales", label: "admin.shop.tab.sales" },
];
type ShopSpec = { title: string; singular: string; endpoint: string; fields: Field[] };
const specs: Record<Tab, ShopSpec> = {
  items: { title: "admin.shop.items.title", singular: "admin.shop.items.singular", endpoint: "/api/v1/admin/shop/items", fields: [
    { key: "name", label: "admin.shop.field.name", required: true },
    { key: "description", label: "admin.shop.field.description", type: "textarea" },
    { key: "image", label: "admin.shop.field.image" },
    { key: "preview_image", label: "admin.shop.field.previewImage" },
    { key: "item_type", label: "admin.shop.field.itemType", type: "select", options: [["AVATAR", "Avatar"], ["BACKGROUND", "admin.shop.option.background"], ["FRAME", "Frame"]] },
    { key: "rarity", label: "admin.shop.field.rarity", type: "select", options: [["COMMON", "admin.shop.option.common"], ["RARE", "admin.shop.option.rare"], ["EPIC", "admin.shop.option.epic"], ["LEGENDARY", "admin.shop.option.legendary"]] },
    { key: "price", label: "admin.shop.field.price", type: "number", required: true },
    { key: "currency", label: "admin.shop.field.currency", type: "select", options: [["COIN", "Coin"], ["GEM", "Gem"]] },
    { key: "status", label: "admin.shop.field.status", type: "select", options: [["ACTIVE", "admin.shop.option.selling"], ["HIDDEN", "admin.shop.option.hidden"]] },
    { key: "is_limited", label: "admin.shop.field.limited", type: "checkbox" },
    { key: "stock", label: "admin.shop.field.stock", type: "number" },
  ] },
  packages: { title: "admin.shop.packages.title", singular: "admin.shop.packages.singular", endpoint: "/api/v1/admin/shop/gem-packages", fields: [
    { key: "title", label: "admin.shop.field.packageName", required: true },
    { key: "description", label: "admin.shop.field.description", type: "textarea" },
    { key: "gem_amount", label: "admin.shop.field.gemAmount", type: "number", required: true },
    { key: "bonus_gem", label: "admin.shop.field.bonusGem", type: "number" },
    { key: "price", label: "admin.shop.field.priceVnd", type: "number", required: true },
    { key: "image", label: "admin.shop.field.image" },
    { key: "sort_order", label: "admin.shop.field.sortOrder", type: "number" },
    { key: "is_popular", label: "admin.shop.field.popular", type: "checkbox" },
    { key: "is_best_value", label: "admin.shop.field.bestValue", type: "checkbox" },
    { key: "is_active", label: "admin.shop.field.activeSale", type: "checkbox" },
  ] },
  promotions: { title: "admin.shop.promotions.title", singular: "admin.shop.promotions.singular", endpoint: "/api/v1/admin/shop/promotions", fields: [
    { key: "title", label: "admin.shop.field.promotionName", required: true },
    { key: "description", label: "admin.shop.field.description", type: "textarea" },
    { key: "bonus_percent", label: "admin.shop.field.bonusPercent", type: "number", required: true },
    { key: "start_at", label: "admin.shop.field.start", type: "datetime-local" },
    { key: "end_at", label: "admin.shop.field.end", type: "datetime-local" },
    { key: "is_active", label: "admin.shop.field.active", type: "checkbox" },
  ] },
  banners: { title: "admin.shop.banners.title", singular: "admin.shop.banners.singular", endpoint: "/api/v1/admin/shop/banners", fields: [
    { key: "title", label: "admin.shop.field.title", required: true },
    { key: "description", label: "admin.shop.field.description", type: "textarea" },
    { key: "image", label: "admin.shop.field.image", required: true },
    { key: "shop_item_id", label: "admin.shop.field.linkedItem", type: "select", options: [] },
    { key: "start_at", label: "admin.shop.field.start", type: "datetime-local" },
    { key: "end_at", label: "admin.shop.field.end", type: "datetime-local" },
    { key: "is_active", label: "admin.shop.field.activeDisplay", type: "checkbox" },
  ] },
  transactions: { title: "admin.shop.transactions.title", singular: "admin.shop.transactions.singular", endpoint: "/api/v1/admin/shop/transactions", fields: [] },
  sales: { title: "admin.shop.sales.title", singular: "admin.shop.sales.singular", endpoint: "/api/v1/admin/shop/purchases", fields: [] },
};
const valueOf = (row: Row, key: string) => row[key] == null ? "" : String(row[key]);
const localDate = (value: unknown) => {
  if (!value) return "";
  const date = new Date(String(value));
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};

export default function AdminShopPage() {
  const { confirm } = useAppDialog();
  const { language, t } = useLanguage();
  const [tab, setTab] = useState<Tab>("items");
  const [rows, setRows] = useState<Row[]>([]);
  const [shopItems, setShopItems] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState<FormState>({});

  const spec = specs[tab];
  const fields = useMemo(() => tab === "banners"
    ? spec.fields.map((field) => field.key === "shop_item_id"
      ? { ...field, options: [["", "admin.shop.option.notLinked"], ...shopItems.map((item) => [item.id, String(item.name ?? t("admin.shop.itemsFallback"))])] as [string, string][] }
      : field)
    : spec.fields, [tab, spec, shopItems, t]);
  const locale = language === "vi" ? "vi-VN" : "en-US";
  const formatNumber = (value: unknown) => Number(value ?? 0).toLocaleString(locale);
  const paymentLabel = (value: unknown) => {
    const key: Record<string, string> = {
      PENDING: "admin.shop.payment.pending", SUCCESS: "admin.shop.payment.success", FAILED: "admin.shop.payment.failed",
      CANCELLED: "admin.shop.payment.cancelled", EXPIRED: "admin.shop.payment.expired", REFUNDED: "admin.shop.payment.refunded",
    };
    const status = String(value ?? "");
    return key[status] ? t(key[status]) : status || "?";
  };
  const itemTypeLabel = (value: unknown) => {
    const key: Record<string, string> = { AVATAR: "admin.shop.type.avatar", BACKGROUND: "admin.shop.option.background", FRAME: "admin.shop.type.frame" };
    const type = String(value ?? "");
    return key[type] ? t(key[type]) : type || "?";
  };
  const rarityLabel = (value: unknown) => {
    const key: Record<string, string> = { COMMON: "admin.shop.option.common", RARE: "admin.shop.option.rare", EPIC: "admin.shop.option.epic", LEGENDARY: "admin.shop.option.legendary" };
    const rarity = String(value ?? "");
    return key[rarity] ? t(key[rarity]) : rarity || "?";
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const paged = tab === "items" || tab === "packages" || tab === "transactions" || tab === "sales";
      const response = await axiosClient.get(specs[tab].endpoint, {
        params: {
          ...(paged ? { page, limit: 30, search: search || undefined } : {}),
          ...(tab === "transactions" && paymentStatus ? { payment_status: paymentStatus } : {}),
        },
      });
      setRows(response.data.data ?? []);
      setTotal(Number(response.data.meta?.total ?? response.data.data?.length ?? 0));
      setPages(Number(response.data.meta?.total_pages ?? 1));
    } catch {
      setError(t("admin.shop.loadError"));
    } finally {
      setLoading(false);
    }
  }, [tab, page, search, paymentStatus, t]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 200);
    return () => window.clearTimeout(timer);
  }, [load]);
  useEffect(() => {
    axiosClient.get("/api/v1/admin/shop/items", { params: { page: 1, limit: 100 } })
      .then((response) => setShopItems(response.data.data ?? []))
      .catch(() => setShopItems([]));
  }, []);

  const openCreate = () => {
    setEditing(null);
    setError("");
    const initial: FormState = {};
    fields.forEach((field) => { initial[field.key] = field.type === "checkbox" ? ["is_active", "is_limited"].includes(field.key) : ""; });
    if (tab === "items") Object.assign(initial, { item_type: "AVATAR", rarity: "COMMON", currency: "COIN", status: "ACTIVE" });
    setForm(initial);
  };

  const openEdit = (row: Row) => {
    setEditing(row);
    setError("");
    const initial: FormState = {};
    fields.forEach((field) => {
      initial[field.key] = field.type === "checkbox" ? Boolean(row[field.key])
        : field.type === "datetime-local" ? localDate(row[field.key]) : valueOf(row, field.key);
    });
    setForm(initial);
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    const payload: Record<string, unknown> = {};
    fields.forEach((field) => {
      const raw = form[field.key];
      if (field.type === "checkbox") payload[field.key] = Boolean(raw);
      else if (field.type === "number") payload[field.key] = raw === "" ? null : Number(raw);
      else if (field.type === "datetime-local") payload[field.key] = raw ? new Date(String(raw)).toISOString() : null;
      else payload[field.key] = raw === "" ? null : raw;
    });
    try {
      if (editing) await axiosClient.patch(`${spec.endpoint}/${editing.id}`, payload);
      else await axiosClient.post(spec.endpoint, payload);
      setEditing(null);
      setNotice(`${t(editing ? "admin.shop.updated" : "admin.shop.created")} ${t(spec.singular)}.`);
      setForm({});
      await load();
    } catch {
      setError(t("admin.shop.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const disable = async (row: Row) => {
    const title = String(row.name ?? row.title ?? t("admin.shop.itemsFallback"));
    const description = t("admin.shop.hideDescription").replace("{title}", title);
    if (!await confirm({ title: t("admin.shop.hideTitle"), description, confirmLabel: t("admin.shop.hideConfirm"), tone: "danger" })) return;
    try {
      await axiosClient.delete(`${spec.endpoint}/${row.id}`);
      setNotice(t("admin.shop.hiddenSuccess"));
      await load();
    } catch {
      setError(t("admin.shop.updateError"));
    }
  };

  const primary = (row: Row) => tab === "items" ? String(row.name ?? "")
    : tab === "sales" ? String((row.shop_items as Record<string, unknown> | null)?.name ?? t("admin.shop.itemsFallback"))
      : tab === "transactions" ? String(row.transaction_code ?? t("admin.shop.order").replace("{id}", String(row.order_code ?? row.id)))
        : String(row.title ?? "");
  const detail = (row: Row) => {
    if (tab === "items") return `${itemTypeLabel(row.item_type)} ? ${rarityLabel(row.rarity)} ? ${formatNumber(row.price)} ${String(row.currency ?? "")}`;
    if (tab === "packages") return `${formatNumber(row.gem_amount)} gem${Number(row.bonus_gem) ? ` + ${formatNumber(row.bonus_gem)} ${t("admin.shop.bonus")}` : ""} ? ${formatNumber(row.price)} ?`;
    if (tab === "promotions") return `${t("admin.shop.field.bonusPercent")}: ${formatNumber(row.bonus_percent)}% ? ${row.start_at ? new Date(String(row.start_at)).toLocaleDateString(locale) : t("admin.shop.noStartLimit")}`;
    if (tab === "transactions") return `${paymentLabel(row.payment_status)} ? ${formatNumber(row.amount)} ? ? ${formatNumber(row.total_gem)} gem ? ${(row.users as Record<string, unknown> | null)?.email ?? t("admin.shop.noEmail")}`;
    if (tab === "sales") return `${(row.users as Record<string, unknown> | null)?.email ?? t("admin.shop.noEmail")} ? ${formatNumber(row.price)} ${String(row.currency ?? "")} ? ${itemTypeLabel((row.shop_items as Record<string, unknown> | null)?.item_type)}`;
    return `${row.shop_item_id ? t("admin.shop.linkedItem") : t("admin.shop.notLinkedItem")} ? ${row.is_active ? t("admin.shop.enabled") : t("admin.shop.disabled")}`;
  };
  const editable = tab === "items" || tab === "packages" || tab === "promotions" || tab === "banners";
  const paged = tab === "items" || tab === "packages" || tab === "transactions" || tab === "sales";

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div><h2 className="text-2xl font-black tracking-tight text-zinc-950">{t("admin.shop.heading")}</h2><p className="mt-1 text-sm text-zinc-600">{t("admin.shop.description")}</p></div>
        {editable && <button onClick={openCreate} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#b7152b] px-4 text-sm font-bold text-white hover:bg-[#a01226]"><Plus size={17}/>{t("admin.shop.create")}</button>}
      </header>
      <nav aria-label={t("admin.shop.title")} className="flex gap-1 overflow-x-auto rounded-2xl border border-zinc-200 bg-white p-1">
        {tabs.map((item) => <button key={item.id} type="button" aria-current={tab === item.id ? "page" : undefined} onClick={() => { setTab(item.id); setPage(1); setSearch(""); setPaymentStatus(""); setEditing(null); setForm({}); setNotice(""); }} className={`shrink-0 rounded-lg px-4 py-2.5 text-sm font-bold ${tab === item.id ? "bg-red-50 text-[#b7152b]" : "text-zinc-600 hover:bg-zinc-50"}`}>{t(item.label)}</button>)}
      </nav>
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h3 className="font-extrabold text-zinc-900">{t(spec.title)}</h3><p className="mt-1 text-xs text-zinc-600">{formatNumber(total)} {t("admin.shop.totalItems")}</p></div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {tab === "transactions" && <Select value={paymentStatus} onValueChange={(value) => { setPaymentStatus(value); setPage(1); }} ariaLabel={t("admin.shop.filterPayment")} options={[{ value: "", label: t("admin.shop.anyStatus") }, ...["PENDING", "SUCCESS", "FAILED", "CANCELLED", "EXPIRED", "REFUNDED"].map((value) => ({ value, label: paymentLabel(value) }))]} className="h-10 min-w-[170px]"/>}
          {paged && <label className="relative w-full sm:max-w-xs"><span className="sr-only">{t("admin.shop.search")}</span><Search size={16} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"/><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder={t("admin.shop.search")} className="h-10 w-full rounded-2xl border border-zinc-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-red-300"/></label>}
        </div>
      </section>
      {notice && <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"><Check size={16}/>{notice}</div>}
      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      <div className="grid gap-3 xl:grid-cols-2">
        {loading ? <div className="col-span-full rounded-2xl border border-zinc-200 bg-white py-16 text-center text-zinc-600"><LoaderCircle aria-label={t("admin.shop.loading")} className="mx-auto animate-spin"/></div>
          : rows.length === 0 ? <div className="col-span-full rounded-xl border border-dashed border-zinc-300 bg-white py-14 text-center text-sm text-zinc-600">{t("admin.shop.empty")}</div>
            : rows.map((row) => {
              const hidden = row.is_active === false || row.status === "HIDDEN";
              const status = tab === "transactions" ? paymentLabel(row.payment_status) : tab === "sales" ? t("admin.shop.purchased") : hidden ? t("admin.shop.option.hidden") : t("admin.shop.enabled");
              const relatedImage = (row.shop_items as Record<string, unknown> | null)?.image;
              return <article key={row.id} className="flex min-w-0 gap-4 rounded-2xl border border-zinc-200 bg-white p-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-zinc-100 text-[#b7152b]">{tab === "packages" ? <Gem size={27} className="fill-[#b7152b]/15"/> : row.image || relatedImage ? <img src={String(row.image ?? relatedImage)} alt="" className="h-full w-full object-cover"/> : <Tag size={22}/>}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h4 className="truncate font-extrabold text-zinc-900">{primary(row) || t("admin.shop.untitled")}</h4><p className="mt-1 text-xs text-zinc-600">{detail(row)}</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${hidden ? "bg-zinc-100 text-zinc-600" : tab === "transactions" ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700"}`}>{status}</span></div>
                  <p className="mt-2 line-clamp-2 text-xs text-zinc-600">{String(row.description ?? (row.users as Record<string, unknown> | null)?.display_name ?? "")}</p>
                  {editable && <div className="mt-3 flex gap-2"><button type="button" onClick={() => openEdit(row)} className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-bold hover:bg-zinc-50"><Pencil size={13}/>{t("admin.shop.edit")}</button>{!hidden && <button type="button" onClick={() => void disable(row)} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-100"><EyeOff size={13}/>{t("admin.shop.hide")}</button>}</div>}
                </div>
              </article>;
            })}
      </div>
      {paged && <div className="flex items-center justify-between text-xs text-zinc-600"><span>{t("admin.shop.page")} {page}/{pages}</span><div className="flex gap-2"><button type="button" aria-label={t("admin.users.previous")} disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)} className="rounded-lg border bg-white p-2 disabled:opacity-40"><ChevronLeft size={16}/></button><button type="button" aria-label={t("admin.users.next")} disabled={page >= pages || loading} onClick={() => setPage((current) => current + 1)} className="rounded-lg border bg-white p-2 disabled:opacity-40"><ChevronRight size={16}/></button></div></div>}
      {form && Object.keys(form).length > 0 && <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-black/40 p-3 sm:p-6" onClick={() => setForm({})}><section onClick={(event) => event.stopPropagation()} className="my-auto max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl"><form onSubmit={(event) => void save(event)}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-100 bg-white px-5 py-4"><div><p className="text-xs font-bold uppercase tracking-wider text-[#b7152b]">{t(editing ? "admin.shop.editing" : "admin.shop.creating")} ? {t(spec.singular)}</p><h3 className="mt-1 text-lg font-black">{editing ? primary(editing) : t("admin.shop.addNew").replace("{item}", t(spec.singular))}</h3></div><button type="button" aria-label={t("admin.shop.close")} onClick={() => setForm({})} className="rounded-lg p-2 hover:bg-zinc-100"><X size={18}/></button></div>
        <div className="grid gap-4 p-5 sm:grid-cols-2">{fields.map((field) => field.type === "checkbox"
          ? <label key={field.key} className="flex min-h-11 items-center gap-3 rounded-xl border border-zinc-200 px-3 text-sm font-semibold sm:col-span-1"><input type="checkbox" checked={Boolean(form[field.key])} onChange={(event) => setForm((value) => ({ ...value, [field.key]: event.target.checked }))} className="h-4 w-4 accent-[#b7152b]"/>{t(field.label)}</label>
          : <label key={field.key} className={`space-y-1.5 text-xs font-bold text-zinc-600 ${field.type === "textarea" ? "sm:col-span-2" : ""}`}><span>{t(field.label)}{field.required && <b className="ml-1 text-[#b7152b]">*</b>}</span>{field.type === "textarea" ? <textarea required={field.required} value={String(form[field.key] ?? "")} onChange={(event) => setForm((value) => ({ ...value, [field.key]: event.target.value }))} rows={3} className="w-full resize-y rounded-xl border border-zinc-200 px-3 py-2.5 text-sm font-medium text-zinc-900 outline-none focus:border-red-300"/> : field.type === "select" ? <Select value={String(form[field.key] ?? field.options?.[0]?.[0] ?? "")} onValueChange={(value) => setForm((state) => ({ ...state, [field.key]: value }))} ariaLabel={t(field.label)} options={(field.options ?? []).map(([value, label]) => ({ value, label: label.startsWith("admin.") ? t(label) : label }))} className="h-10 w-full"/> : <input required={field.required} type={field.type ?? "text"} min={field.type === "number" ? "0" : undefined} step={field.key === "price" && tab === "packages" ? "any" : undefined} value={String(form[field.key] ?? "")} onChange={(event) => setForm((value) => ({ ...value, [field.key]: event.target.value }))} className="h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm font-medium text-zinc-900 outline-none focus:border-red-300"/>}</label>)}</div>
        {error && <p role="alert" className="mx-5 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        <div className="sticky bottom-0 flex justify-end gap-2 border-t border-zinc-100 bg-white px-5 py-4"><button type="button" onClick={() => setForm({})} className="rounded-xl px-4 py-2.5 text-sm font-bold text-zinc-600 hover:bg-zinc-50">{t("admin.shop.cancel")}</button><button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#b7152b] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">{saving && <LoaderCircle size={15} className="animate-spin"/>}{t("admin.shop.save")}</button></div>
      </form></section></div>}
    </div>
  );
}
