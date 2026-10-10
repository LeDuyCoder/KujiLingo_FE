"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { LoaderCircle, Plus, Search, Trash2 } from "lucide-react";
import { axiosClient } from "@/shared/api/axiosClient";
import { useAppDialog } from "@/shared/components/ui/AppDialogProvider";
import { useLanguage } from "@/shared/i18n/language";

type Vocabulary = { id: string; word_jp: string | null; reading_hiragana: string | null; meaning_vi: string | null; jlpt_level: string | null };
type Props = { topicId: string; jlptLevel?: string; onError: (message: string) => void; onNotice: (message: string) => void };

export default function TopicVocabularyManager({ topicId, jlptLevel, onError, onNotice }: Props) {
  const { confirm } = useAppDialog();
  const { t } = useLanguage();
  const [attached, setAttached] = useState<Vocabulary[]>([]);
  const [results, setResults] = useState<Vocabulary[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [busyId, setBusyId] = useState("");

  const loadAttached = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosClient.get("/api/v1/vocabularies", { params: { topic_id: topicId, page: 1, limit: 100 } });
      setAttached(response.data.data ?? []);
    } catch {
      onError(t("admin.topicVocabulary.loadError"));
    } finally {
      setLoading(false);
    }
  }, [onError, t, topicId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadAttached(), 0);
    return () => window.clearTimeout(timer);
  }, [loadAttached]);

  const searchVocabulary = async (event: FormEvent) => {
    event.preventDefault();
    if (!query.trim()) { setResults([]); return; }
    setSearching(true);
    try {
      const response = await axiosClient.get("/api/v1/vocabularies", { params: { search: query.trim(), jlpt_level: jlptLevel, page: 1, limit: 20 } });
      setResults(response.data.data ?? []);
    } catch {
      onError(t("admin.topicVocabulary.searchError"));
    } finally {
      setSearching(false);
    }
  };

  const attach = async (vocabulary: Vocabulary) => {
    setBusyId(vocabulary.id);
    try {
      await axiosClient.post(`/api/v1/admin/topics/${topicId}/vocabularies`, { vocabulary_id: vocabulary.id });
      await loadAttached();
      onNotice(t("admin.topicVocabulary.attachSuccess"));
    } catch {
      onError(t("admin.topicVocabulary.attachError"));
    } finally {
      setBusyId("");
    }
  };

  const detach = async (vocabulary: Vocabulary) => {
    const word = vocabulary.word_jp ?? t("admin.topicVocabulary.wordFallback");
    const description = t("admin.topicVocabulary.detachDescription").replace("{word}", word);
    if (!await confirm({ title: t("admin.topicVocabulary.detachTitle"), description, confirmLabel: t("admin.topicVocabulary.detachConfirm"), tone: "danger" })) return;
    setBusyId(vocabulary.id);
    try {
      await axiosClient.delete(`/api/v1/admin/topics/${topicId}/vocabularies/${vocabulary.id}`);
      await loadAttached();
      onNotice(t("admin.topicVocabulary.detachSuccess"));
    } catch {
      onError(t("admin.topicVocabulary.detachError"));
    } finally {
      setBusyId("");
    }
  };

  const attachedIds = new Set(attached.map((word) => word.id));

  return (
    <section className="mt-4 rounded-xl bg-zinc-50 p-3">
      <div className="flex items-center justify-between gap-2"><h5 className="text-xs font-extrabold text-zinc-700">{t("admin.topicVocabulary.title")}</h5><span className="text-[11px] text-zinc-600">{loading ? t("admin.topicVocabulary.loading") : `${attached.length} ${t("admin.topicVocabulary.count")}`}</span></div>
      {loading ? <LoaderCircle aria-label={t("admin.topicVocabulary.loading")} size={15} className="mt-3 animate-spin text-zinc-600"/> : attached.length ? <ul className="mt-2 flex flex-wrap gap-1.5">{attached.map((word) => <li key={word.id} className="inline-flex max-w-full items-center gap-1 rounded-lg border border-zinc-200 bg-white py-1 pl-2 pr-1 text-xs"><span className="truncate font-bold text-zinc-800">{word.word_jp || word.reading_hiragana}</span><span className="max-w-28 truncate text-zinc-600">{word.meaning_vi}</span><button type="button" aria-label={t("admin.topicVocabulary.detachWord").replace("{word}", word.word_jp ?? t("admin.topicVocabulary.wordFallback"))} disabled={busyId === word.id} onClick={() => void detach(word)} className="rounded-md p-1 text-zinc-600 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"><Trash2 size={12}/></button></li>)}</ul> : <p className="mt-2 text-xs text-zinc-600">{t("admin.topicVocabulary.empty")}</p>}
      <form onSubmit={(event) => void searchVocabulary(event)} className="mt-3 flex gap-2">
        <label className="relative min-w-0 flex-1"><span className="sr-only">{t("admin.topicVocabulary.search")}</span><Search size={14} aria-hidden="true" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500"/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("admin.topicVocabulary.searchPlaceholder")} className="h-9 w-full rounded-lg border border-zinc-200 bg-white pl-8 pr-2 text-xs outline-none focus:border-red-300"/></label>
        <button disabled={searching || !query.trim()} className="inline-flex h-9 shrink-0 items-center gap-1 rounded-lg bg-zinc-900 px-3 text-xs font-bold text-white disabled:opacity-50"><Search size={13}/>{searching ? t("admin.topicVocabulary.searching") : t("admin.topicVocabulary.search")}</button>
      </form>
      {results.length > 0 && <ul className="mt-2 max-h-52 space-y-1 overflow-y-auto">{results.map((word) => { const isAttached = attachedIds.has(word.id); return <li key={word.id} className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-2.5 py-2"><span className="min-w-0 flex-1"><strong className="text-xs text-zinc-900">{word.word_jp} <span className="font-normal text-zinc-500">{word.reading_hiragana}</span></strong><span className="ml-2 text-[11px] text-zinc-600">{word.meaning_vi}</span></span><button type="button" disabled={isAttached || busyId === word.id} onClick={() => void attach(word)} aria-label={isAttached ? t("admin.topicVocabulary.attached") : t("admin.topicVocabulary.attach")} className="rounded-md p-1.5 text-[#b7152b] hover:bg-red-50 disabled:text-zinc-400"><Plus size={14}/></button></li>; })}</ul>}
      {results.length === 0 && query.trim() && !searching && <p className="mt-2 text-xs text-zinc-600">{t("admin.topicVocabulary.searchEmpty")}</p>}
    </section>
  );
}
