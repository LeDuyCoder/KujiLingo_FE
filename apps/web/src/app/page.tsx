"use client";

import React, { useState } from "react";
import Link from "next/link";
import { authService } from "@/features/authentication/services/auth.service";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authService.login(formData.email, formData.password, formData.rememberMe);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Sign in failed");
      }
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await authService.loginWithGoogle();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Google OAuth failed");
      }
    }
  };

  return (
    <div className="h-screen w-full flex font-sans text-slate-900 bg-white overflow-hidden select-none">
      
      {/* CỘT TRÁI - BRANDING & FEATURES */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between bg-[#F8F9FA] p-8 xl:p-10 relative overflow-hidden">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <svg className="w-7 h-7 text-[#B91C1C]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0014.07 6H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z" />
          </svg>
          <span className="text-xl font-bold text-[#B91C1C]">KujiLingo</span>
        </div>

        {/* Khối nội dung chính */}
        <div className="max-w-[400px] mx-auto w-full text-center">
          {/* Vòng tròn minh họa */}
          <div className="w-40 h-40 xl:w-44 xl:h-44 mx-auto bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 mb-4 overflow-hidden">
             <div className="text-center text-slate-400 text-xs">
                <span className="text-3xl block mb-1">⛩️</span>
                App Mockup
             </div>
          </div>

          <h1 className="text-3xl xl:text-4xl font-extrabold text-slate-900 mb-2 leading-tight">
            Learn Japanese <br /> Smarter
          </h1>
          <p className="text-slate-500 text-xs xl:text-sm mb-5 leading-relaxed">
            Master Hiragana, Katakana, and Kanji through an adaptive, distraction-free environment.
          </p>

          {/* Feature Cards */}
          <div className="space-y-2.5 text-left">
            <div className="flex items-center p-3 bg-white rounded-xl border border-red-100 shadow-sm">
              <div className="flex-shrink-0 w-9 h-9 bg-[#B91C1C] rounded-lg flex items-center justify-center text-white mr-3">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800">Smart Flashcards</h3>
                <p className="text-[11px] text-slate-500">Spaced repetition system tailored to your memory retention.</p>
              </div>
            </div>
            
            <div className="flex items-center p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
              <div className="flex-shrink-0 w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mr-3">
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800">Interactive Mini Games</h3>
                <p className="text-[11px] text-slate-500">Reinforce vocabulary with engaging, quick-burst challenges.</p>
              </div>
            </div>

            <div className="flex items-center p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
              <div className="flex-shrink-0 w-9 h-9 bg-slate-700 rounded-lg flex items-center justify-center text-white mr-3">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800">Achievement System</h3>
                <p className="text-[11px] text-slate-500">Track your mastery level as you conquer new lessons.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="h-2"></div>
      </div>

      {/* CỘT PHẢI - FORM ĐĂNG NHẬP */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 xl:p-12 overflow-hidden">
        <div className="w-full max-w-[380px]">
          <h2 className="text-3xl font-bold text-slate-900 mb-1.5">Welcome Back</h2>
          <p className="text-slate-500 text-xs mb-6">Sign in to continue your learning journey.</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="you@example.com"
                  className="block w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#B91C1C] focus:border-[#B91C1C] text-xs outline-none transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-9 py-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#B91C1C] focus:border-[#B91C1C] text-xs outline-none transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? (
                     <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                  ) : (
                     <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-0.5">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="rememberMe"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  className="h-3.5 w-3.5 text-[#B91C1C] focus:ring-[#B91C1C] border-slate-300 rounded cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-xs text-slate-600 cursor-pointer">
                  Remember me
                </label>
              </div>
              <a href="#" className="text-xs font-medium text-[#B91C1C] hover:text-red-800 transition-colors">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-xs font-bold text-white bg-[#B91C1C] hover:bg-red-800 focus:outline-none transition-colors"
            >
              Sign In
            </button>
          </form>

          <div className="mt-5">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white text-slate-400 font-medium tracking-wider text-[11px]">OR</span>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 border border-slate-300 rounded-lg shadow-sm bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>
          </div>

          <p className="mt-6 text-center text-xs text-slate-600">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-semibold text-[#B91C1C] hover:text-red-800">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}