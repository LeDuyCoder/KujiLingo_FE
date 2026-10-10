"use client";

import { useEffect } from "react";
import { useLanguage } from "./language";

export function LanguageDocumentSync() {
  const { language } = useLanguage();

  useEffect(() => {
    document.documentElement.lang = language === "vi" ? "vi" : "en";
  }, [language]);

  return null;
}
