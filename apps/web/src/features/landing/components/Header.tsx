import React from "react";
import Link from "next/link";
import { BrandLogo } from "@/shared/components/BrandLogo";
import { useLanguage } from "@/shared/i18n/language";

export const Header = () => {
  const { t } = useLanguage();
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl h-20 items-center justify-between px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <BrandLogo />
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="#methodology"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            {t("landing.navMethodology")}
          </Link>
          <Link
            href="#arena"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            {t("landing.navArena")}
          </Link>
          <Link
            href="#curriculum"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            {t("landing.navCurriculum")}
          </Link>
          <Link
            href="#faq"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            {t("landing.navFaq")}
          </Link>
        </nav>

        {/* CTA Button */}
        <div className="flex items-center gap-4">
          <Link href="/login">
            <button className="flex h-10 items-center justify-center rounded-full bg-[#b7152b] text-white px-6 font-medium text-sm hover:bg-[#a01226] active:scale-[0.98] transition-all cursor-pointer shadow-md shadow-red-100">
              {t("landing.login")}
            </button>
          </Link>
        </div>
      </div>
    </header>
  );
};
