"use client";

import React, { useState, useEffect } from "react";
import { User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";
import { Checkbox } from "@/shared/components/ui/Checkbox";
import { useAuthStore } from "../stores/auth.store";
import { GoogleSignInButton } from "./GoogleSignInButton";
import { useLanguage } from "@/shared/i18n/language";

export const RegisterForm = () => {
  const router = useRouter();
  const { register, isLoading, error, user, clearError } = useAuthStore();
  const { t } = useLanguage();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    clearError();
  }, [clearError]);

  useEffect(() => {
    if (user) {
      router.push("/courses");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientError(null);

    if (isLoading) return;

    if (displayName.trim().length < 2) {
      setClientError(t("auth.nameTooShort"));
      return;
    }
    if (password !== confirmPassword) {
      setClientError(t("auth.passwordMismatch"));
      return;
    }
    if (!acceptedTerms) {
      setClientError(t("auth.acceptTermsRequired"));
      return;
    }
    if (password.length < 8) {
      setClientError(t("auth.passwordTooShort"));
      return;
    }

    const result = await register({
      email,
      password,
      password_confirmation: confirmPassword,
      display_name: displayName,
      accepted_terms: acceptedTerms,
    });

    if (result.success) {
      setSuccessMessage(t("auth.registerSuccess"));
    }
  };

  if (user) {
    return (
      <div className="w-full max-w-[420px] px-4 md:px-0 flex flex-col items-center justify-center min-h-[300px] text-center">
        <div className="w-12 h-12 border-4 border-[#b7152b] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-zinc-600">{t("auth.redirecting")}</p>
      </div>
    );
  }

  if (successMessage) {
    return (
      <div className="w-full max-w-[420px] px-4 md:px-0 flex flex-col items-center justify-center text-center gap-5 py-8">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-50 text-green-600">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-zinc-900">{t("auth.checkEmail")}</h2>
        <p className="text-zinc-500 text-sm leading-relaxed max-w-xs">{successMessage}</p>
        <Link href="/login">
          <button className="mt-2 text-sm font-semibold text-[#b7152b] hover:underline">
            {t("auth.backToSignIn")}
          </button>
        </Link>
      </div>
    );
  }

  const displayError = clientError || error;

  return (
    <div className="w-full max-w-[420px] px-4 md:px-0 animate-fade-in-up">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-zinc-900 mb-1.5">{t("auth.registerTitle")}</h1>
        <p className="text-sm text-zinc-500">{t("auth.registerDescription")}</p>
      </div>

      {/* Error Banner */}
      {displayError && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          <span className="mt-0.5 shrink-0">⚠️</span>
          <span>{displayError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col gap-5">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-zinc-600 mb-1.5" htmlFor="register-name">
              {t("auth.fullName")}
            </label>
            <Input
              id="register-name"
              type="text"
              placeholder={t("auth.namePlaceholder")}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={isLoading}
              required
              icon={<User size={16} className="text-zinc-400" />}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-zinc-600 mb-1.5" htmlFor="register-email">
              {t("auth.email")}
            </label>
            <Input
              id="register-email"
              type="email"
              placeholder={t("auth.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
              icon={<Mail size={16} className="text-zinc-400" />}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-zinc-600 mb-1.5" htmlFor="register-password">
              {t("auth.password")}
            </label>
            <Input
              id="register-password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
              icon={<Lock size={16} className="text-zinc-400" />}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-zinc-400 hover:text-zinc-600 transition-colors"
                  aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-semibold text-zinc-600 mb-1.5" htmlFor="register-confirm-password">
              {t("auth.confirmPassword")}
            </label>
            <Input
              id="register-confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              required
              icon={<Lock size={16} className="text-zinc-400" />}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="text-zinc-400 hover:text-zinc-600 transition-colors"
                  aria-label={showConfirmPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />
          </div>

          {/* Accept Terms */}
          <div className="flex items-start gap-3">
            <Checkbox
              id="register-terms"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              disabled={isLoading}
            />
            <label htmlFor="register-terms" className="text-xs text-zinc-500 leading-relaxed cursor-pointer">
              {t("auth.agree")}{" "}
              <Link href="/terms" className="text-[#b7152b] font-medium hover:underline">
                {t("auth.terms")}
              </Link>{" "}
              {t("auth.and")}{" "}
              <Link href="/privacy" className="text-[#b7152b] font-medium hover:underline">
                {t("auth.privacy")}
              </Link>
              .
            </label>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t("auth.creatingAccount")}
              </>
            ) : (
              t("auth.createAccount")
            )}
          </Button>
        </div>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-100" />
        </div>
        <div className="relative flex justify-center">
            <span className="bg-white px-3 text-xs text-zinc-400">{t("auth.or")}</span>
        </div>
      </div>

      {/* Google OAuth */}
      <GoogleSignInButton mode="register" disabled={isLoading || !acceptedTerms} />

      {/* Sign In Link */}
      <p className="mt-6 text-center text-xs text-zinc-500">
        {t("auth.alreadyHaveAccount")}{" "}
        <Link href="/login" className="font-semibold text-[#b7152b] hover:underline">
          {t("auth.signIn")}
        </Link>
      </p>
    </div>
  );
};
