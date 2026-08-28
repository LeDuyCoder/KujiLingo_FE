"use client";

import React, { useState, useEffect } from "react";
import { User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";
import { Checkbox } from "@/shared/components/ui/Checkbox";
import { useAuthStore } from "../stores/auth.store";

export const RegisterForm = () => {
  const router = useRouter();
  const { register, isLoading, error, user, clearError } = useAuthStore();

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
      router.push("/");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientError(null);

    if (isLoading) return;

    if (displayName.trim().length < 2) {
      setClientError("Display name must be at least 2 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setClientError("Passwords do not match.");
      return;
    }
    if (!acceptedTerms) {
      setClientError("You must agree to the Terms of Service and Privacy Policy.");
      return;
    }
    if (password.length < 8) {
      setClientError("Password must be at least 8 characters.");
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
      setSuccessMessage("Account created successfully! Please check your email to verify your account.");
    }
  };

  if (user) {
    return (
      <div className="w-full max-w-[420px] px-4 md:px-0 flex flex-col items-center justify-center min-h-[300px] text-center">
        <div className="w-12 h-12 border-4 border-[#b7152b] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-zinc-600">You are already signed in. Redirecting...</p>
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
        <h2 className="text-2xl font-bold text-zinc-900">Check your email</h2>
        <p className="text-zinc-500 text-sm leading-relaxed max-w-xs">{successMessage}</p>
        <Link href="/login">
          <button className="mt-2 text-sm font-semibold text-[#b7152b] hover:underline">
            Back to Sign In
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
        <h1 className="text-2xl font-bold text-zinc-900 mb-1.5">Create Your Account</h1>
        <p className="text-sm text-zinc-500">Start learning Japanese today</p>
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
              Full Name
            </label>
            <Input
              id="register-name"
              type="text"
              placeholder="John Doe"
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
              Email Address
            </label>
            <Input
              id="register-email"
              type="email"
              placeholder="you@example.com"
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
              Password
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
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-semibold text-zinc-600 mb-1.5" htmlFor="register-confirm-password">
              Confirm Password
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
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
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
              I agree to the{" "}
              <Link href="#" className="text-[#b7152b] font-medium hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="#" className="text-[#b7152b] font-medium hover:underline">
                Privacy Policy
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
                Creating account...
              </>
            ) : (
              "Create Account →"
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
          <span className="bg-white px-3 text-xs text-zinc-400">OR</span>
        </div>
      </div>

      {/* Google OAuth */}
      <button
        type="button"
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2.5 h-12 rounded-xl border border-zinc-200 bg-white text-sm font-medium text-zinc-700 hover:bg-zinc-50 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        Continue with Google
      </button>

      {/* Sign In Link */}
      <p className="mt-6 text-center text-xs text-zinc-500">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-[#b7152b] hover:underline">
          Sign In
        </Link>
      </p>
    </div>
  );
};
