"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Button } from "@/shared/components/ui/Button";
import { useAuthStore } from "../stores/auth.store";
import { useLanguage } from "@/shared/i18n/language";

export const VerifyEmail = () => {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  
  const { verifyEmail, clearError } = useAuthStore();
  const [status, setStatus] = useState<"loading" | "error" | "idle">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Clear previous errors when unmounting or starting
    clearError();
    return () => clearError();
  }, [clearError]);

  useEffect(() => {
    let isMounted = true;

    const performVerification = async () => {
      if (!token) {
        if (isMounted) {
          setStatus("error");
          setErrorMessage(t("verify.missingToken"));
        }
        return;
      }

      setStatus("loading");
      const result = await verifyEmail(token);

      if (isMounted) {
        if (result.success) {
          // Redirect immediately to the verify-success page which has a beautiful UI
          router.replace("/verify-success");
        } else {
          setStatus("error");
          // Friendly error mapping based on backend code or message
          if (result.code === "TOKEN_ALREADY_USED") {
            setErrorMessage(t("verify.alreadyUsed"));
          } else if (result.code === "TOKEN_EXPIRED") {
            setErrorMessage(t("verify.expired"));
          } else if (result.code === "TOKEN_NOT_FOUND") {
            setErrorMessage(t("verify.invalid"));
          } else {
            setErrorMessage(t("verify.genericError"));
          }
        }
      }
    };

    performVerification();

    return () => {
      isMounted = false;
    };
  }, [token, verifyEmail, router, t]);

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center w-full max-w-[420px] px-4 animate-fade-in-up text-center">
        <div className="w-12 h-12 border-4 border-[#b7152b] border-t-transparent rounded-full animate-spin mb-6" />
        <h2 className="text-2xl font-bold text-zinc-900 mb-2">{t("verify.loading")}</h2>
        <p className="text-zinc-500 text-sm">{t("verify.loadingHint")}</p>
      </div>
    );
  }

  // Error Status UI
  return (
    <div className="flex flex-col items-center justify-center w-full max-w-[420px] px-4 animate-fade-in-up text-center">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-50 text-red-600 mb-6">
        <AlertCircle size={32} strokeWidth={2.5} />
      </div>

      <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 mb-3">
        {t("verify.failed")}
      </h1>

      <p className="text-zinc-600 text-sm leading-relaxed mb-8 max-w-sm">
        {errorMessage}
      </p>

      <div className="w-full">
        <Link href="/login" className="w-full">
          <Button className="w-full h-12">{t("verify.backLogin")}</Button>
        </Link>
      </div>
    </div>
  );
};
