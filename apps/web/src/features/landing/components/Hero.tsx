"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export const Hero = () => {
  const [progress, setProgress] = useState(70);

  // Countdown animation for live match card
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 1) return 100;
        return prev - 1;
      });
    }, 50); // 5s loop
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative overflow-hidden bg-white py-20 lg:py-28" id="hero">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -z-10 h-[600px] w-[600px] rounded-full bg-red-50/40 blur-3xl" />
      <div className="absolute bottom-0 left-0 -z-10 h-[400px] w-[400px] rounded-full bg-zinc-50 blur-3xl" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8 items-center">
          {/* Left Column - Content */}
          <div className="lg:col-span-7 flex flex-col justify-center text-left">
            {/* Beta Tag */}
            <div className="inline-flex items-center gap-2 self-start rounded-full border border-red-100 bg-red-50/50 px-3.5 py-1 text-xs font-semibold tracking-wider text-[#b7152b] uppercase mb-6 animate-fade-in-up">
              <span className="h-1.5 w-1.5 rounded-full bg-[#b7152b] animate-pulse" />
              Now in Open Beta
            </div>

            {/* Headline */}
            <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl leading-[1.1] mb-6 animate-fade-in-up delay-100">
              Fluency demands <br className="hidden sm:inline" />
              <span className="inline-flex items-center gap-2 sm:gap-3 text-zinc-950 font-black">
                <span className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-red-50 text-[#b7152b]">
                  🔥
                </span>
                Competitive
              </span>{" "}
              <br />
              Discipline.
            </h1>

            {/* Subtitle */}
            <p className="text-lg text-zinc-600 leading-relaxed max-w-2xl mb-8 animate-fade-in-up delay-200">
              The informational hub for the elite learning platform designed for JLPT mastery, 
              powered by real-time PvP battles and spaced-repetition science.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center animate-fade-in-up delay-300">
              <Link href="/login">
                <button className="flex h-14 w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-[#b7152b] text-white px-8 font-semibold text-base hover:bg-[#a01226] active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-red-100">
                  Join the Elite
                  <span className="text-lg">🛡️</span>
                </button>
              </Link>
              <Link href="#methodology">
                <button className="flex h-14 w-full sm:w-auto items-center justify-center rounded-full border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 px-8 font-semibold text-base active:scale-[0.98] transition-all cursor-pointer">
                  See how it works
                </button>
              </Link>
            </div>
          </div>

          {/* Right Column - Live Match Card */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end animate-fade-in-up delay-200">
            <div className="w-full max-w-[400px] rounded-3xl border border-zinc-100 bg-white p-6 shadow-xl shadow-zinc-100/80 animate-float">
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-8">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                  <span className="text-xs font-bold tracking-widest text-zinc-400 uppercase">
                    Live Match
                  </span>
                </div>
                <div className="h-2 w-2 rounded-full bg-red-500" />
              </div>

              {/* Kanji Question Area */}
              <div className="flex flex-col items-center justify-center py-10 bg-zinc-50/50 rounded-2xl border border-zinc-50/80 mb-6">
                <span className="text-6xl font-black text-zinc-900 mb-6 tracking-wider">
                  漢字
                </span>
                <span className="text-xs font-bold tracking-widest text-zinc-400 uppercase animate-pulse">
                  Opponent Answering...
                </span>
              </div>

              {/* Timer Progress Bar */}
              <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#b7152b] h-full transition-all duration-75 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
