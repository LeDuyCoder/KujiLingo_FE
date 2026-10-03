import type { ReactNode } from "react";
import Link from "next/link";
import { BrandLogo } from "@/shared/components/BrandLogo";

type LegalSection = {
  title: string;
  content: ReactNode;
};

export function LegalDocument({
  title,
  description,
  sections,
}: {
  title: string;
  description: string;
  sections: LegalSection[];
}) {
  return (
    <main className="min-h-screen bg-[#faf9f7] px-5 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <header className="mb-10 flex items-center justify-between">
          <Link href="/" aria-label="KujiLingo home" className="inline-flex items-center">
            <BrandLogo size="small" />
          </Link>
          <Link href="/" className="text-sm font-medium text-zinc-600 transition hover:text-[#b7152b]">
            Back to KujiLingo
          </Link>
        </header>

        <article className="rounded-3xl border border-zinc-200 bg-white px-6 py-9 shadow-sm sm:px-12 sm:py-12">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#b7152b]">KujiLingo · Legal</p>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">{title}</h1>
          <p className="mt-4 max-w-2xl leading-7 text-zinc-600">{description}</p>
          <p className="mt-5 text-sm text-zinc-500">Last updated: October 3, 2026</p>

          <div className="mt-10 divide-y divide-zinc-100">
            {sections.map((section, index) => (
              <section key={section.title} className="py-7 first:pt-0 last:pb-0">
                <h2 className="text-lg font-semibold text-zinc-900">
                  <span className="mr-3 text-sm font-medium text-[#b7152b]">{String(index + 1).padStart(2, "0")}</span>
                  {section.title}
                </h2>
                <div className="legal-copy mt-3 space-y-3 text-[15px] leading-7 text-zinc-600">{section.content}</div>
              </section>
            ))}
          </div>
        </article>

        <footer className="flex flex-wrap items-center justify-between gap-3 px-1 py-7 text-sm text-zinc-500">
          <span>© {new Date().getFullYear()} KujiLingo</span>
          <nav aria-label="Legal pages" className="flex gap-5">
            <Link href="/privacy" className="hover:text-zinc-900">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-zinc-900">Terms of Service</Link>
          </nav>
        </footer>
      </div>
      <style>{`.legal-copy a { color: #b7152b; text-decoration: underline; text-underline-offset: 3px; } .legal-copy ul { list-style: disc; padding-left: 1.25rem; }`}</style>
    </main>
  );
}
