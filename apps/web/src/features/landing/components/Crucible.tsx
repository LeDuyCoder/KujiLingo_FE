"use client";

import React from "react";
import { Swords, Trophy } from "lucide-react";

export const Crucible = () => {
  return (
    <section className="bg-white py-20 lg:py-24 border-b border-zinc-100" id="arena">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-8 items-center">
          
          {/* Left Column: Match Found UI Card Simulation */}
          <div className="relative flex justify-center lg:justify-start">
            {/* Background glowing orb */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-red-50/60 blur-3xl -z-10" />
            
            <div className="w-full max-w-[420px] rounded-3xl border border-zinc-100 bg-white p-8 shadow-xl shadow-zinc-100 flex flex-col items-center animate-fade-in-up">
              <div className="text-center mb-8">
                <h3 className="text-sm font-black tracking-widest text-[#b7152b] uppercase mb-1 animate-pulse">
                  Match Found
                </h3>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  Starting in 3...
                </p>
              </div>

              {/* Competitors Area */}
              <div className="flex w-full items-center justify-between gap-4 mb-10">
                {/* Player 1 */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-zinc-900 border-2 border-zinc-900 mb-3 shadow-md overflow-hidden relative">
                    <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-zinc-800 to-transparent" />
                    <span className="absolute inset-0 flex items-center justify-center font-bold text-white text-xl">
                      P1
                    </span>
                  </div>
                  <span className="text-sm font-bold text-zinc-900">You</span>
                  <span className="text-xs font-medium text-zinc-500">1240 ELO</span>
                </div>

                {/* VS Badge */}
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-zinc-50 text-zinc-400 font-black italic text-sm shrink-0">
                  VS
                </div>

                {/* Player 2 */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-[#b7152b] border-2 border-[#b7152b] mb-3 shadow-md shadow-red-200 overflow-hidden relative">
                    <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-black/20 to-transparent" />
                    <span className="absolute inset-0 flex items-center justify-center font-bold text-white text-xl">
                      P2
                    </span>
                  </div>
                  <span className="text-sm font-bold text-zinc-900">Opponent</span>
                  <span className="text-xs font-medium text-zinc-500">1255 ELO</span>
                </div>
              </div>

              {/* CTA Simulation */}
              <div className="w-full flex items-center justify-center rounded-xl bg-zinc-950 py-3.5 text-xs font-bold tracking-widest text-white uppercase shadow-lg border border-zinc-800 animate-pulse">
                Prepare for Battle
              </div>
            </div>
          </div>

          {/* Right Column: Text Content */}
          <div className="flex flex-col justify-center text-left lg:pl-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-red-50/50 px-3.5 py-1 text-xs font-semibold tracking-wider text-[#b7152b] uppercase mb-6 self-start">
              The Crucible
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl mb-6 leading-[1.15]">
              Test your mettle against the world.
            </h2>
            <p className="text-lg text-zinc-500 max-w-xl leading-relaxed mb-10">
              Knowledge is tested in the forge of competition. Enter the Arena to match against 
              students of similar skill globally and prove your fluency under pressure.
            </p>

            {/* Feature Bullets */}
            <div className="flex flex-col gap-8">
              <div className="flex gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-50 text-[#b7152b] shrink-0">
                  <Swords size={20} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-zinc-900 mb-1">Real-Time Duels</h4>
                  <p className="text-sm text-zinc-500 leading-relaxed">
                    Answer vocabulary and grammar questions simultaneously. Speed and accuracy determine 
                    who deals damage to their opponent&apos;s health bar.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-50 text-[#b7152b] shrink-0">
                  <Trophy size={20} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-zinc-900 mb-1">Elo Rating System</h4>
                  <p className="text-sm text-zinc-500 leading-relaxed">
                    Climb the ranks from Bronze novice to Grandmaster scholar. Your rating reflects 
                    your true, battle-tested fluency and pairs you with worthy adversaries.
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
