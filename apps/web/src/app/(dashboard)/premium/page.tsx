"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, XCircle, Infinity, Ban, Gem, ArrowRight } from "lucide-react";
import Image from "next/image";

export default function PremiumLandingPage() {
  return (
    <div className="flex flex-col gap-16 pb-12 w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Hero Section */}
      <section className="flex flex-col lg:flex-row items-center gap-12 mt-8">
        <div className="flex-1 space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-100/50 text-[#b7152b] text-sm font-semibold border border-red-100">
            <span className="w-2 h-2 rounded-full bg-[#b7152b] animate-pulse" />
            Pro Membership
          </div>
          
          <h1 className="text-5xl lg:text-6xl font-black text-zinc-900 tracking-tight leading-[1.1]">
            Unlock Your Full <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#b7152b] to-rose-500">
              Japanese Potential.
            </span>
          </h1>
          
          <p className="text-lg text-zinc-600 max-w-xl leading-relaxed">
            Accelerate your JLPT journey with unlimited access, premium gamification features, and priority tools designed for serious learners.
          </p>
          
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link 
              href="/premium/plans"
              className="inline-flex items-center justify-center px-8 py-4 rounded-2xl bg-[#b7152b] text-white font-bold text-lg hover:bg-rose-700 transition-all shadow-lg shadow-red-200 hover:-translate-y-1"
            >
              Upgrade Now
            </Link>
            <Link 
              href="/premium/plans"
              className="inline-flex items-center justify-center px-8 py-4 rounded-2xl bg-red-50 text-[#b7152b] font-bold text-lg hover:bg-red-100 transition-all"
            >
              View Plans
            </Link>
          </div>
          
          <div className="flex items-center gap-6 pt-4 text-sm font-medium text-zinc-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-green-500" />
              Secure Payment
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-400" />
              Cancel Anytime
            </div>
          </div>
        </div>
        
        {/* Images Wrapper */}
        <div className="flex-1 relative h-[500px] w-full max-w-lg hidden lg:flex justify-center items-center">
          {/* Back Image */}
          <div className="absolute right-0 top-0 w-64 h-96 rounded-[2rem] overflow-hidden shadow-2xl rotate-6 hover:rotate-12 transition-transform duration-500 z-10 border-4 border-white">
            <div className="relative w-full h-full">
               <Image 
                 src="https://images.unsplash.com/photo-1545569341-9eb8b30979d9?q=80&w=800&auto=format&fit=crop"
                 alt="Japanese Spring"
                 fill
                 sizes="(max-width: 768px) 100vw, 33vw"
                 priority
                 className="object-cover"
               />
            </div>
          </div>
          {/* Front Image */}
          <div className="absolute left-8 bottom-0 w-64 h-[26rem] rounded-[2rem] overflow-hidden shadow-2xl -rotate-3 hover:rotate-0 transition-transform duration-500 z-20 border-4 border-white">
             <div className="relative w-full h-full">
               <Image 
                 src="https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=800&auto=format&fit=crop"
                 alt="Japanese Temple"
                 fill
                 sizes="(max-width: 768px) 100vw, 33vw"
                 className="object-cover"
               />
             </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="flex flex-col items-center justify-center space-y-12 mt-16">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Why Go Pro?</h2>
          <p className="text-zinc-500 font-medium max-w-md mx-auto">
            Experience KujiLingo without limits. Everything you need to master Japanese faster.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          {/* Card 1 */}
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-zinc-100 hover:shadow-xl hover:border-red-100 transition-all duration-300 group">
            <div className="w-14 h-14 rounded-2xl bg-red-50 text-[#b7152b] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[#b7152b] group-hover:text-white transition-all duration-300">
              <Infinity className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 mb-3">Unlimited Learning</h3>
            <p className="text-zinc-500 leading-relaxed text-sm">
              No hearts or energy limits. Study as much as you want, whenever you want.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-zinc-100 hover:shadow-xl hover:border-red-100 transition-all duration-300 group">
            <div className="w-14 h-14 rounded-2xl bg-red-50 text-[#b7152b] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[#b7152b] group-hover:text-white transition-all duration-300">
              <Ban className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 mb-3">Ad-Free Experience</h3>
            <p className="text-zinc-500 leading-relaxed text-sm">
              Stay focused on your goals without any distracting advertisements.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-zinc-100 hover:shadow-xl hover:border-red-100 transition-all duration-300 group">
            <div className="w-14 h-14 rounded-2xl bg-red-50 text-[#b7152b] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[#b7152b] group-hover:text-white transition-all duration-300">
              <Gem className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 mb-3">Premium Cosmetics</h3>
            <p className="text-zinc-500 leading-relaxed text-sm">
              Unlock exclusive avatars, profile themes, and badges to stand out.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="mt-8">
        <div className="relative overflow-hidden bg-zinc-950 rounded-[2.5rem] p-12 text-center shadow-2xl shadow-zinc-900/50">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]" />
          <div className="relative z-10 flex flex-col items-center justify-center">
            <h2 className="text-3xl lg:text-4xl font-black text-white mb-4">
              Ready to become a Pro learner?
            </h2>
            <p className="text-zinc-400 font-medium text-base mb-8 max-w-md mx-auto">
              Join thousands of students mastering Japanese faster with KujiLingo Pro.
            </p>
            <Link 
              href="/premium/plans"
              className="inline-flex items-center gap-2 bg-[#b7152b] text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-rose-700 hover:scale-105 transition-all duration-300 shadow-xl shadow-red-900/50"
            >
              Upgrade to Pro Today
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
