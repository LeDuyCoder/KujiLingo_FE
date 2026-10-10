"use client";

import React from "react";
import { Target, Timer, BarChart3 } from "lucide-react";
import { useLanguage } from "@/shared/i18n/language";

export const Science = () => {
  const { t } = useLanguage();
  return (
    <section className="bg-zinc-50/50 py-20 lg:py-24 border-y border-zinc-100" id="methodology">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="text-left mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-red-50/50 px-3.5 py-1 text-xs font-semibold tracking-wider text-[#b7152b] uppercase mb-4">
            {t("landing.science")}
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl mb-4">
            {t("landing.scienceTitle")}
          </h2>
          <p className="text-lg text-zinc-500 max-w-2xl leading-relaxed">
            {t("landing.scienceDescription")}
          </p>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Card 1: Adaptive SRS */}
          <div className="flex flex-col justify-between rounded-3xl border border-zinc-100 bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-md">
            <div>
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-50 text-zinc-700 mb-6">
                <Target size={22} className="text-zinc-600" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 mb-3">{t("landing.adaptiveSrs")}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed mb-6">
                {t("landing.adaptiveSrsDescription")}
              </p>
            </div>
            {/* Segmented Progress Bar */}
            <div className="flex gap-1.5 mt-auto pt-4">
              <div className="h-2 flex-1 rounded-full bg-[#b7152b] opacity-30" />
              <div className="h-2 flex-1 rounded-full bg-[#b7152b] opacity-50" />
              <div className="h-2 flex-1 rounded-full bg-[#b7152b] opacity-70" />
              <div className="h-2 flex-1 rounded-full bg-[#b7152b] opacity-90" />
              <div className="h-2 flex-1 rounded-full bg-[#b7152b]" />
            </div>
          </div>

          {/* Card 2: Time-Boxed Stress */}
          <div className="flex flex-col justify-between rounded-3xl border border-zinc-100 bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-md">
            <div>
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-50 text-zinc-700 mb-6">
                <Timer size={22} className="text-zinc-600" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 mb-3">{t("landing.timePressure")}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed mb-6">
                {t("landing.timePressureDescription")}
              </p>
            </div>
            {/* Large Stats Display */}
            <div className="mt-auto pt-4">
              <span className="text-xs font-bold tracking-widest text-zinc-400 uppercase block mb-1">
                {t("landing.averageResponse")}
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black tracking-tight text-zinc-900">1.2</span>
                <span className="text-lg font-bold text-zinc-500">{t("landing.seconds")}</span>
              </div>
            </div>
          </div>

          {/* Card 3: Granular Analytics */}
          <div className="flex flex-col justify-between rounded-3xl border border-zinc-100 bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-md">
            <div>
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-50 text-zinc-700 mb-6">
                <BarChart3 size={22} className="text-zinc-600" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 mb-3">{t("landing.analytics")}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed mb-6">
                {t("landing.analyticsDescription")}
              </p>
            </div>
            {/* Chart Simulation */}
            <div className="flex items-end gap-1.5 h-10 mt-auto pt-4">
              <div className="w-full bg-zinc-100 rounded-t h-[40%] hover:bg-[#b7152b] transition-all" />
              <div className="w-full bg-zinc-100 rounded-t h-[65%] hover:bg-[#b7152b] transition-all" />
              <div className="w-full bg-zinc-100 rounded-t h-[50%] hover:bg-[#b7152b] transition-all" />
              <div className="w-full bg-[#b7152b] rounded-t h-[85%] transition-all" />
              <div className="w-full bg-zinc-100 rounded-t h-[30%] hover:bg-[#b7152b] transition-all" />
            </div>
          </div>
        </div>

        {/* ELO Rating Dark Card (Matches Climb the Global Ranks) */}
        <div className="mt-8 rounded-3xl bg-zinc-950 text-white p-8 lg:p-10 shadow-lg border border-zinc-900 flex flex-col md:flex-row items-center justify-between gap-8 transition-transform duration-300 hover:scale-[1.005]">
          <div className="text-left max-w-xl">
            <h3 className="text-2xl font-bold tracking-tight mb-3">{t("landing.globalRanks")}</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              {t("landing.globalRanksDescription")}
            </p>
          </div>
          {/* ELO Circle Progress SVG */}
          <div className="relative shrink-0 flex items-center justify-center">
            <svg className="w-28 h-28 transform -rotate-90">
              <circle
                cx="56"
                cy="56"
                r="46"
                className="stroke-zinc-800"
                strokeWidth="6"
                fill="transparent"
              />
              <circle
                cx="56"
                cy="56"
                r="46"
                className="stroke-[#b7152b]"
                strokeWidth="6"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 46}
                strokeDashoffset={2 * Math.PI * 46 * (1 - 1840 / 2500)} // 1840 ELO out of 2500 max ELO
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
                Elo
              </span>
              <span className="text-xl font-black text-white tracking-tight">
                1840
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
