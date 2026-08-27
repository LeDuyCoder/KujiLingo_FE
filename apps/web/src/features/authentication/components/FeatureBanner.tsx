import React from "react";
import { Layers, Gamepad2, Trophy } from "lucide-react";

export const FeatureBanner = () => {
  return (
    <div className="flex flex-col justify-between h-full bg-[#fbf8f8] p-12 lg:p-16 border-r border-zinc-100">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#b7152b] text-white font-bold text-xl">
          <span className="text-sm font-sans">文A</span>
        </div>
        <span className="text-2xl font-bold tracking-tight text-zinc-900">
          Kuji<span className="text-[#b7152b]">Lingo</span>
        </span>
      </div>

      {/* Hero Illustration */}
      <div className="flex flex-col items-center text-center my-auto py-8">
        <div className="w-[180px] h-[180px] rounded-full bg-white flex items-center justify-center relative overflow-hidden shadow-md mb-8 group animate-float hover:scale-105 transition-transform duration-500">
          <img
            src="/img/logo.png"
            alt="KujiLingo Logo"
            className="w-full h-full object-cover"
          />
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 mb-3 animate-fade-in-up opacity-0">
          Learn Japanese Smarter
        </h1>
        <p className="text-sm text-zinc-500 max-w-sm leading-relaxed animate-fade-in-up delay-100 opacity-0">
          Master Hiragana, Katakana, and Kanji through an adaptive, distraction-free environment.
        </p>
      </div>

      {/* Feature Cards */}
      <div className="flex flex-col gap-4 mt-auto">
        <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-zinc-100 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 animate-fade-in-up delay-200 opacity-0">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-red-50 text-red-600 bg-red-50 text-red-600 shrink-0">
            <Layers size={22} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-950 mb-0.5">Smart Flashcards</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Spaced repetition system tailored to your memory retention.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-zinc-100 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 animate-fade-in-up delay-300 opacity-0">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 text-blue-600 bg-blue-50 text-blue-600 shrink-0">
            <Gamepad2 size={22} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-950 mb-0.5">Interactive Mini Games</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Reinforce vocabulary with engaging, quick-burst challenges.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-zinc-100 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 animate-fade-in-up delay-400 opacity-0">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-teal-50 text-teal-600 bg-teal-50 text-teal-600 shrink-0">
            <Trophy size={22} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-950 mb-0.5">Achievement System</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Track your mastery level as you conquer new lessons.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
