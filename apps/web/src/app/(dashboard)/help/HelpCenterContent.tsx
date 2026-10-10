"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Mail, Search } from "lucide-react";
import { useLanguage } from "@/shared/i18n/language";

const faqItems = [
  {
    question: "help.faq.passwordQuestion",
    answer: "help.faq.passwordAnswer",
  },
  {
    question: "help.faq.wordsQuestion",
    answer: "help.faq.wordsAnswer",
  },
  {
    question: "help.faq.dictionaryQuestion",
    answer: "help.faq.dictionaryAnswer",
  },
  {
    question: "help.faq.progressQuestion",
    answer: "help.faq.progressAnswer",
  },
  {
    question: "help.faq.proQuestion",
    answer: "help.faq.proAnswer",
  },
  {
    question: "help.faq.lessonQuestion",
    answer: "help.faq.lessonAnswer",
  },
  {
    question: "help.faq.goalQuestion",
    answer: "help.faq.goalAnswer",
  },
];

const normalizeSearchText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLocaleLowerCase();

export default function HelpCenterContent() {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [openQuestion, setOpenQuestion] = useState<number | null>(null);
  const contactHref = `mailto:?subject=${encodeURIComponent(t("help.contactSubject"))}&body=${encodeURIComponent(t("help.contactBody"))}`;

  useEffect(() => {
    document.title = `${t("help.title")} | KujiLingo`;
  }, [t]);

  const filteredFaqs = useMemo(() => {
    const keyword = normalizeSearchText(query.trim());
    if (!keyword) return faqItems.map((item, index) => ({ ...item, index }));

    return faqItems
      .map((item, index) => ({ ...item, index }))
      .filter((item) =>
        normalizeSearchText(`${t(item.question)} ${t(item.answer)}`).includes(keyword),
      );
  }, [query, t]);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 pb-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">
          {t("help.title")}
        </h1>
        <p className="text-zinc-500">
          {t("help.description")}
        </p>
      </header>

      <label className="relative block">
        <Search
          aria-hidden="true"
          size={20}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
        />
        <span className="sr-only">{t("help.searchLabel")}</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("help.searchPlaceholder")}
          className="h-14 w-full rounded-2xl border border-zinc-200 bg-white pl-12 pr-4 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-[#c8102e] focus:ring-4 focus:ring-rose-100"
        />
      </label>

      <section aria-labelledby="faq-heading" className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 id="faq-heading" className="text-xl font-bold text-zinc-900">
            {t("help.faq")}
          </h2>
          <span className="text-sm text-zinc-400">
            {filteredFaqs.length} {t("help.questionCount")}
          </span>
        </div>

        <div className="space-y-3">
          {filteredFaqs.map((item) => {
            const isOpen = openQuestion === item.index;
            const answerId = `help-answer-${item.index}`;

            return (
              <article
                key={item.index}
                className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-colors hover:border-zinc-300"
              >
                <h3>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={answerId}
                    onClick={() =>
                      setOpenQuestion(isOpen ? null : item.index)
                    }
                    className="flex min-h-16 w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold text-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#c8102e]"
                  >
                    <span>{t(item.question)}</span>
                    <ChevronDown
                      aria-hidden="true"
                      size={20}
                      className={`shrink-0 text-zinc-400 transition-transform ${
                        isOpen ? "rotate-180 text-[#c8102e]" : ""
                      }`}
                    />
                  </button>
                </h3>
                <div
                  id={answerId}
                  hidden={!isOpen}
                  className="border-t border-zinc-100 px-5 py-4 text-sm leading-6 text-zinc-600"
                >
                  {t(item.answer)}
                </div>
              </article>
            );
          })}

          {filteredFaqs.length === 0 && (
            <p className="rounded-2xl border border-dashed border-zinc-300 bg-white px-5 py-8 text-center text-sm text-zinc-500">
              {t("help.noResults")}
            </p>
          )}
        </div>
      </section>

      <section className="flex flex-col items-start justify-between gap-5 rounded-2xl border border-rose-100 bg-rose-50/70 p-6 sm:flex-row sm:items-center sm:p-7">
        <div>
          <h2 className="font-bold text-zinc-900">
            {t("help.contactTitle")}
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            {t("help.contactDescription")}
          </p>
        </div>
        <a
          href={contactHref}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#b7152b] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#a01226] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-200"
        >
          <Mail aria-hidden="true" size={17} />
          {t("help.contact")}
        </a>
      </section>
    </div>
  );
}
