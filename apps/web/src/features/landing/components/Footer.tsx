import React from "react";
import Link from "next/link";
import { BrandLogo } from "@/shared/components/BrandLogo";
import { useLanguage } from "@/shared/i18n/language";

export const Footer = () => {
  const { t } = useLanguage();
  return (
    <footer className="bg-white border-t border-zinc-100 py-12">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Logo */}
        <div className="flex items-center gap-2">
          <BrandLogo size="small" />
        </div>

        {/* Links */}
        <div className="flex items-center gap-8 text-sm font-medium text-zinc-500">
          <Link href="/privacy" className="hover:text-zinc-900 transition-colors">{t("landing.privacy")}</Link>
          <Link href="/terms" className="hover:text-zinc-900 transition-colors">{t("landing.terms")}</Link>
        </div>

        {/* Copyright */}
        <p className="text-sm text-zinc-400">
          © {new Date().getFullYear()} KujiLingo. {t("landing.copyright")}
        </p>

      </div>
    </footer>
  );
};
