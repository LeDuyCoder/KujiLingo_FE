"use client";

import React, { useState, useEffect } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";
import { Checkbox } from "@/shared/components/ui/Checkbox";
import { useAuthStore } from "../stores/authStore";

export const LoginForm = () => {
  const router = useRouter();
  const { login, isLoading, error, user, clearError } = useAuthStore();
  
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    clearError();
  }, [clearError]);

  useEffect(() => {
    if (mounted && user) {
      router.push("/");
    }
  }, [mounted, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const deviceName = typeof window !== "undefined" ? window.navigator.userAgent : "Web Client";
    const success = await login(email, password, deviceName);
    
    if (success) {
      router.push("/");
    }
  };

  if (!mounted) {
    return (
      <div className="w-full max-w-[420px] px-4 md:px-0 flex items-center justify-center min-h-[300px]">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-zinc-200 h-10 w-10"></div>
          <div className="flex-1 space-y-6 py-1">
            <div className="h-2 bg-zinc-200 rounded"></div>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div className="h-2 bg-zinc-200 rounded col-span-2"></div>
                <div className="h-2 bg-zinc-200 rounded col-span-1"></div>
              </div>
              <div className="h-2 bg-zinc-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="w-full max-w-[420px] px-4 md:px-0 flex flex-col items-center justify-center min-h-[300px] text-center">
        <div className="w-12 h-12 border-4 border-[#b7152b] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-zinc-600">You are already signed in. Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[420px] px-4 md:px-0 animate-fade-in-up">
      <div className="mb-6">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900 mb-2">
          Welcome Back
        </h2>
        <p className="text-base text-zinc-500">
          Sign in to continue your learning journey.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-3 animate-fade-in">
          <svg className="h-5 w-5 text-red-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="flex-1">
            <p className="font-semibold text-red-900">Đăng nhập thất bại</p>
            <p className="mt-1 text-red-700">{error}</p>
          </div>
        </div>
      )}

      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-zinc-700">
            Email Address
          </label>
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            icon={<Mail size={20} className="text-zinc-400" />}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-zinc-700">
            Password
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
            label="Remember me"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            disabled={isLoading}
          />
          <a
            href="#"
            className="font-medium text-[#b7152b] hover:text-[#a01226] hover:underline"
          >
            Forgot password?
          </a>
        </div>

        <Button type="submit" className="mt-2" disabled={isLoading}>
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Signing In...</span>
            </div>
          ) : (
            "Sign In"
          )}
        </Button>

        <div className="relative my-2 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-200 border-zinc-200" />
          </div>
          <span className="relative bg-white px-3 text-sm text-zinc-400 bg-white">
            OR
          </span>
        </div>

        <Button
          type="button"
          variant="outline"
          className="flex items-center justify-center gap-3 border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </Button>

        <div className="mt-4 text-center text-sm text-zinc-500">
          Don&apos;t have an account?{" "}
          <a
            href="#"
            className="font-medium text-[#b7152b] hover:text-[#a01226] hover:underline"
          >
            Create Account
          </a>
        </div>
      </form>
    </div>
  );
};
