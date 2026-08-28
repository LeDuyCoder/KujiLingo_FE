"use client";

import React from "react";

export const Curriculum = () => {
  return (
    <section className="bg-zinc-50/50 py-20 lg:py-24 border-b border-zinc-100" id="curriculum">
      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-20 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-red-50/50 px-3.5 py-1 text-xs font-semibold tracking-wider text-[#b7152b] uppercase mb-4">
            The Path
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl mb-4">
            JLPT Mastery Curriculum.
          </h2>
          <p className="text-lg text-zinc-500 max-w-2xl leading-relaxed">
            A structured, unyielding progression from fundamentals to native-level comprehension, 
            perfectly aligned with the JLPT standards.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-zinc-200 -translate-x-1/2" />

          <div className="flex flex-col gap-16">
            
            {/* N5 Node */}
            <div className="relative flex flex-col md:flex-row items-center w-full group">
              {/* Central Badge */}
              <div className="absolute left-8 md:left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white border-2 border-zinc-200 flex items-center justify-center font-bold text-sm text-zinc-500 z-10 group-hover:border-[#b7152b] group-hover:text-[#b7152b] transition-colors">
                N5
              </div>
              {/* Content Card (Left) */}
              <div className="w-full md:w-1/2 pl-20 md:pl-0 md:pr-16 flex justify-end">
                <div className="w-full max-w-sm rounded-3xl border border-zinc-100 bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-md text-left md:text-right hover:-translate-y-1">
                  <div className="text-xs font-mono text-zinc-400 mb-2">800 Vocab · 100 Kanji</div>
                  <h3 className="text-xl font-bold text-zinc-900 mb-3">The Foundation</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">
                    Master hiragana, katakana, and the essential 100 kanji. Build the core grammar 
                    structures required for basic survival Japanese.
                  </p>
                </div>
              </div>
            </div>

            {/* N4 Node */}
            <div className="relative flex flex-col md:flex-row items-center w-full group">
              {/* Central Badge */}
              <div className="absolute left-8 md:left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white border-2 border-zinc-200 flex items-center justify-center font-bold text-sm text-zinc-500 z-10 group-hover:border-[#b7152b] group-hover:text-[#b7152b] transition-colors">
                N4
              </div>
              {/* Content Card (Right) */}
              <div className="w-full md:w-1/2 pl-20 md:pl-16 flex justify-start md:ml-auto">
                <div className="w-full max-w-sm rounded-3xl border border-zinc-100 bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-md text-left hover:-translate-y-1">
                  <div className="text-xs font-mono text-zinc-400 mb-2">1,500 Vocab · 300 Kanji</div>
                  <h3 className="text-xl font-bold text-zinc-900 mb-3">Basic Fluency</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">
                    Expand your vocabulary and grasp essential daily conversation patterns. Transition 
                    from textbook Japanese to practical usage.
                  </p>
                </div>
              </div>
            </div>

            {/* N3 Node */}
            <div className="relative flex flex-col md:flex-row items-center w-full group">
              {/* Central Badge */}
              <div className="absolute left-8 md:left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white border-2 border-zinc-200 flex items-center justify-center font-bold text-sm text-zinc-500 z-10 group-hover:border-[#b7152b] group-hover:text-[#b7152b] transition-colors">
                N3
              </div>
              {/* Content Card (Left) */}
              <div className="w-full md:w-1/2 pl-20 md:pl-0 md:pr-16 flex justify-end">
                <div className="w-full max-w-sm rounded-3xl border border-zinc-100 bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-md text-left md:text-right hover:-translate-y-1">
                  <div className="text-xs font-mono text-zinc-400 mb-2">3,700 Vocab · 650 Kanji</div>
                  <h3 className="text-xl font-bold text-zinc-900 mb-3">Intermediate Bridge</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">
                    The turning point. Begin consuming native media and understanding complex nuances. 
                    A massive expansion of kanji recognition.
                  </p>
                </div>
              </div>
            </div>

            {/* N2+ Node (Dark Card) */}
            <div className="relative flex flex-col md:flex-row items-center w-full group">
              {/* Central Badge */}
              <div className="absolute left-8 md:left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-zinc-950 border-4 border-white flex items-center justify-center font-bold text-base text-white z-10 shadow-md">
                N2+
              </div>
              {/* Content Card (Right) */}
              <div className="w-full md:w-1/2 pl-20 md:pl-16 flex justify-start md:ml-auto">
                <div className="w-full max-w-sm rounded-3xl border border-zinc-900 bg-zinc-950 p-8 shadow-xl shadow-red-900/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-red-900/20 text-left">
                  <div className="text-xs font-mono text-zinc-400 mb-2">10,000+ Vocab · 2,000+ Kanji</div>
                  <h3 className="text-xl font-bold text-white mb-3">Advanced Mastery</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    Business-level proficiency and native text comprehension. The ultimate proving ground 
                    for the dedicated scholar.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
