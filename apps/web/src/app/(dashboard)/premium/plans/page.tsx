"use client";

import React, { useState } from "react";
import { CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function PremiumPlansPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");

  return (
    <div className="flex flex-col items-center justify-center py-8 w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h1 className="text-4xl lg:text-5xl font-black text-zinc-900 tracking-tight mb-4">
          Master Japanese Faster
        </h1>
        <p className="text-zinc-500 font-medium text-lg leading-relaxed">
          Unlock unlimited practice, remove ads, and access exclusive JLPT resources tailored to your proficiency level.
        </p>
      </div>

      {/* Toggle */}
      <div className="flex items-center justify-center mb-16 relative">
        <div className="bg-white border border-zinc-200 p-1 rounded-full inline-flex relative shadow-sm">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`relative z-10 px-6 py-2.5 rounded-full text-sm font-bold transition-colors ${
              billingCycle === "monthly" ? "text-white" : "text-zinc-500 hover:text-zinc-900"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle("yearly")}
            className={`relative z-10 px-6 py-2.5 rounded-full text-sm font-bold transition-colors ${
              billingCycle === "yearly" ? "text-white" : "text-zinc-500 hover:text-zinc-900"
            }`}
          >
            Yearly
          </button>
          
          {/* Animated background pill */}
          <div 
            className={`absolute top-1 bottom-1 w-[100px] bg-[#b7152b] rounded-full transition-transform duration-300 ease-out ${
              billingCycle === "monthly" ? "translate-x-0" : "translate-x-[90px]"
            }`} 
          />
        </div>
        
        {/* Save Badge */}
        <div className="absolute -top-4 -right-12 bg-rose-200 text-[#b7152b] text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-wider rotate-[15deg] shadow-sm border border-rose-300">
          Save 35%
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl items-center">
        
        {/* Free Plan */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm flex flex-col h-full hover:shadow-lg transition-all">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-zinc-900 mb-2">Free</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-zinc-900">0 Gem</span>
              <span className="text-zinc-400 font-medium">/mãi mãi</span>
            </div>
            <p className="text-sm text-zinc-500 mt-2">Basic access for casual learners.</p>
          </div>
          
          <div className="flex-1 space-y-4 mb-8">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
              <span className="text-zinc-700 font-medium text-sm">Basic JLPT N5 Vocabulary</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
              <span className="text-zinc-700 font-medium text-sm">Daily Streak Tracking</span>
            </div>
            <div className="flex items-start gap-3 opacity-50">
              <XCircle className="w-5 h-5 text-zinc-400 shrink-0" />
              <span className="text-zinc-400 font-medium text-sm">Ad-supported experience</span>
            </div>
            <div className="flex items-start gap-3 opacity-50">
              <XCircle className="w-5 h-5 text-zinc-400 shrink-0" />
              <span className="text-zinc-400 font-medium text-sm">Limited Daily Hearts</span>
            </div>
          </div>
          
          <button className="w-full py-4 rounded-2xl bg-zinc-50 text-zinc-400 font-bold cursor-not-allowed">
            Current Plan
          </button>
        </div>

        {/* Yearly Pro (Highlighted) */}
        <div className="bg-white p-8 rounded-[2.5rem] border-2 border-[#b7152b] shadow-2xl shadow-red-100 flex flex-col h-full transform md:-translate-y-4 relative">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#b7152b] text-white text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-md">
            ★ Best Value
          </div>
          
          <div className="mb-6 mt-2">
            <h3 className="text-xl font-bold text-[#b7152b] mb-2">Yearly Pro</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-zinc-900">1.990 Gem</span>
              <span className="text-zinc-400 font-medium">/năm</span>
            </div>
            <p className="text-sm text-zinc-500 mt-2">
              Thanh toán hàng năm. Chỉ khoảng <strong className="text-zinc-700">165 Gem/tháng</strong>.
            </p>
          </div>
          
          <div className="flex-1 space-y-4 mb-8">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#b7152b] shrink-0" />
              <span className="text-zinc-800 font-bold text-sm">Unlimited Everything</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#b7152b] shrink-0" />
              <span className="text-zinc-700 font-medium text-sm">Zero Ads, Zero Interruptions</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#b7152b] shrink-0" />
              <span className="text-zinc-700 font-medium text-sm">Advanced JLPT N3–N1 Content</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#b7152b] shrink-0" />
              <span className="text-zinc-700 font-medium text-sm">Offline Mode & Downloads</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#b7152b] shrink-0" />
              <span className="text-zinc-700 font-medium text-sm">Premium Profile Cosmetics</span>
            </div>
          </div>
          
          <button className="w-full py-4 rounded-2xl bg-[#b7152b] hover:bg-rose-700 text-white font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-200">
            Upgrade Now
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Monthly Pro */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm flex flex-col h-full hover:shadow-lg transition-all">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-zinc-900 mb-2">Monthly Pro</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-zinc-900">199 Gem</span>
              <span className="text-zinc-400 font-medium">/tháng</span>
            </div>
            <p className="text-sm text-zinc-500 mt-2">Flexible monthly gem subscription.</p>
          </div>
          
          <div className="flex-1 space-y-4 mb-8">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-zinc-800 shrink-0" />
              <span className="text-zinc-700 font-medium text-sm">Unlimited Practice</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-zinc-800 shrink-0" />
              <span className="text-zinc-700 font-medium text-sm">Ad-free Experience</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-zinc-800 shrink-0" />
              <span className="text-zinc-700 font-medium text-sm">All JLPT Levels</span>
            </div>
            <div className="flex items-start gap-3 opacity-50">
              <XCircle className="w-5 h-5 text-zinc-400 shrink-0" />
              <span className="text-zinc-400 font-medium text-sm">No Premium Cosmetics</span>
            </div>
          </div>
          
          <button className="w-full py-4 rounded-2xl bg-zinc-50 hover:bg-zinc-100 text-zinc-700 font-bold transition-colors">
            Choose Monthly
          </button>
        </div>

      </div>
      
      <div className="mt-12">
         <Link href="/premium" className="text-zinc-400 hover:text-zinc-700 font-medium text-sm underline underline-offset-4">
           Return to features
         </Link>
      </div>

    </div>
  );
}
