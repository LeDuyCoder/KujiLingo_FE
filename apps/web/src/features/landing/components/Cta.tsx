"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const Cta = () => {
  return (
    <section className="bg-white py-20 lg:py-24" id="cta">
      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        <div className="relative rounded-3xl bg-red-50/40 border border-red-50 p-8 md:p-12 lg:py-16 lg:px-20 text-center overflow-hidden">
          {/* Background glowing effects */}
          <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-red-100/50 blur-2xl" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-red-100/50 blur-2xl" />

          <div className="relative z-10 flex flex-col items-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl mb-4">
              Ready to test your limits?
            </h2>
            <p className="text-zinc-600 text-sm md:text-base leading-relaxed max-w-xl mb-8">
              Stop passively tapping through flashcards. Join the ranks of serious learners 
              and forge your fluency in the arena.
            </p>
            
            <Link href="/login">
              <button className="flex h-14 items-center justify-center gap-2 rounded-full bg-[#b7152b] text-white px-8 font-semibold text-base hover:bg-[#a01226] active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-red-100 group">
                Register Now
                <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
