"use client";

import React, { useState, useEffect } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";
import { Checkbox } from "@/shared/components/ui/Checkbox";
import { useAuthStore } from "../stores/auth.store";
import { GoogleSignInButton } from "./GoogleSignInButton";
import { useLanguage } from "@/shared/i18n/language";

export const LoginForm = () => {
  const router = useRouter();
  const { login, isLoading, error, user, clearError } = useAuthStore();
  const { t } = useLanguage();
  const demoUserEmail = process.env.NEXT_PUBLIC_DEMO_USER_EMAIL || "user_demo_1@example.com";
  const demoUserPassword = process.env.NEXT_PUBLIC_DEMO_USER_PASSWORD || "Password123";
  const demoAdminEmail = process.env.NEXT_PUBLIC_DEMO_ADMIN_EMAIL;
  const demoAdminPassword = process.env.NEXT_PUBLIC_DEMO_ADMIN_PASSWORD;
  const hasDemoAdminCredentials = Boolean(demoAdminEmail && demoAdminPassword);
  
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    clearError();
  }, [clearError]);

  useEffect(() => {
    if (user) {
      router.push("/courses");
    }
  }, [user, router]);

  const signIn = async (loginEmail: string, loginPassword: string) => {
    if (isLoading) return;

    const deviceName = typeof window !== "undefined" ? window.navigator.userAgent : "Web Client";
    const success = await login(loginEmail, loginPassword, deviceName);
    
    if (success) {
      router.push("/courses");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signIn(email, password);
  };

  if (user) {
    return (
      <div className="w-full max-w-[420px] px-4 md:px-0 flex flex-col items-center justify-center min-h-[300px] text-center">
        <div className="w-12 h-12 border-4 border-[#b7152b] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-zinc-600">{t("auth.redirecting")}</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[420px] px-4 md:px-0 animate-fade-in-up">
      <div className="mb-6">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900 mb-2">
          {t("auth.welcomeBack")}
        </h2>
        <p className="text-base text-zinc-500">
          {t("auth.loginDescription")}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-3 animate-fade-in">
          <svg className="h-5 w-5 text-red-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="flex-1">
            <p className="font-semibold text-red-900">{t("auth.loginFailed")}</p>
            <p className="mt-1 text-red-700">{error}</p>
          </div>
        </div>
      )}

      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-zinc-700">
            {t("auth.email")}
          </label>
          <Input
            type="email"
            placeholder={t("auth.emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            icon={<Mail size={20} className="text-zinc-400" />}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-zinc-700">
            {t("auth.password")}
          </label>
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            icon={<Lock size={20} className="text-zinc-400" />}
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                className="text-zinc-400 hover:text-zinc-600 focus:outline-none flex items-center justify-center h-full cursor-pointer disabled:opacity-50"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            }
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <Checkbox
            label={t("auth.remember")}
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            disabled={isLoading}
          />
          <a
            href="#"
            className="font-medium text-[#b7152b] hover:text-[#a01226] hover:underline"
          >
            {t("auth.forgotPassword")}
          </a>
        </div>

        <Button type="submit" className="mt-2" disabled={isLoading}>
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>{t("auth.signingIn")}</span>
            </div>
          ) : (
            t("auth.signIn")
          )}
        </Button>

        <div className="relative my-2 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-200 border-zinc-200" />
          </div>
          <span className="relative bg-white px-3 text-sm text-zinc-400 bg-white">
            {t("auth.or")}
          </span>
        </div>

        <GoogleSignInButton disabled={isLoading} />

        {process.env.NODE_ENV === "development" && (
          <div className="mt-2">
            <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-zinc-400">
              {t("auth.devLogin")}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-xl border-zinc-200 px-3 text-sm"
                disabled={isLoading}
                onClick={() => signIn(demoUserEmail, demoUserPassword)}
              >
                {isLoading ? t("auth.signingIn") : t("auth.learner")}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-xl border-zinc-200 px-3 text-sm"
                disabled={isLoading || !hasDemoAdminCredentials}
                onClick={() => {
                  if (demoAdminEmail && demoAdminPassword) {
                    void signIn(demoAdminEmail, demoAdminPassword);
                  }
                }}
              >
                {isLoading ? t("auth.signingIn") : t("auth.admin")}
              </Button>
            </div>
            {!hasDemoAdminCredentials && (
              <p className="mt-2 text-center text-xs text-zinc-400">
                Cấu hình NEXT_PUBLIC_DEMO_ADMIN_EMAIL và NEXT_PUBLIC_DEMO_ADMIN_PASSWORD trong apps/web/.env.local để bật đăng nhập admin.
              </p>
            )}
          </div>
        )}

        <div className="mt-4 text-center text-sm text-zinc-500">
          {t("auth.noAccount")}{" "}
          <Link
            href="/register"
            className="font-medium text-[#b7152b] hover:text-[#a01226] hover:underline"
          >
            {t("auth.createAccount")}
          </Link>
        </div>
      </form>
    </div>
  );
};
