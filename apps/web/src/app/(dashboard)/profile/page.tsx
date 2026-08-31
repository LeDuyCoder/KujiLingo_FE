"use client";

import React, { useState, useEffect } from "react";
import { useAuthStore } from "@/features/authentication/stores/auth.store";
import { axiosClient } from "@/shared/api/axiosClient";
import { 
  Flame, Globe, Flag, TrendingUp, BookOpen, Target, 
  Edit3, Settings as SettingsIcon, Package, User, Loader2, Star
} from "lucide-react";

interface UserStats {
  level: number;
  exp: number;
  streak: number;
  total_reviews: number;
  accuracy_percent: number | null;
  total_mastered: number;
}

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [rank, setRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Trang cá nhân | KujiLingo";
    
    const fetchData = async () => {
      try {
        const [statsRes, lbRes] = await Promise.all([
          axiosClient.get("/api/v1/statistics/me"),
          axiosClient.get("/api/v1/leaderboard", { params: { period_type: "all_time", limit: 1 } }).catch(() => null)
        ]);
        
        if (statsRes.data?.success) {
          setStats(statsRes.data.data);
        }
        if (lbRes?.data?.success && lbRes.data.data.current_user) {
          setRank(lbRes.data.data.current_user.rank);
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchData();
    }
  }, [user]);

  if (!user || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#b7152b]" />
        <span className="text-sm text-zinc-500 font-semibold">Đang tải hồ sơ...</span>
      </div>
    );
  }

  const isPremium = user.is_premium;
  const targetJLPT = user.jlpt_target_level || "Chưa chọn";

  return (
    <div className="w-full space-y-6 animate-fade-in-up pb-10">
      
      {/* Top Banner Profile Section */}
      <div className="bg-white border border-zinc-200/60 rounded-3xl overflow-hidden shadow-sm">
        {/* Solid Brand Red Banner */}
        <div className="h-32 sm:h-40 bg-[#b7152b] relative" />

        {/* Profile Details Container */}
        <div className="px-6 pb-6 sm:px-8 sm:pb-8 relative">
          
          {/* Avatar & Action Buttons Row */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 -mt-16 mb-4 relative z-10">
            
            {/* Avatar & Level Badge */}
            <div className="relative flex flex-col items-center sm:items-start shrink-0 mx-auto sm:mx-0">
              <div className="w-32 h-32 bg-white rounded-full p-1.5 shadow-md">
                <div className="w-full h-full rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 border border-zinc-200 overflow-hidden">
                  <User size={54} strokeWidth={1.5} />
                </div>
              </div>
              <div className="absolute -bottom-2 px-3 py-1 bg-zinc-950 text-white text-[10px] font-black rounded-full border-2 border-white shadow-sm z-20">
                Lvl {stats?.level || 1}
              </div>
            </div>

            {/* Action Buttons (Inventory, Edit, Gear) */}
            <div className="flex items-center justify-center gap-2.5 sm:mb-2">
              <button className="h-10 px-5 flex items-center gap-2 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-full text-xs font-bold text-zinc-700 transition-colors shadow-sm cursor-pointer">
                <Package size={14} />
                <span className="hidden sm:inline">Túi đồ</span>
              </button>
              <button className="h-10 px-5 flex items-center gap-2 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-full text-xs font-bold text-zinc-700 transition-colors shadow-sm cursor-pointer">
                <Edit3 size={14} />
                <span className="hidden sm:inline">Sửa hồ sơ</span>
              </button>
              <button className="w-10 h-10 flex items-center justify-center bg-white hover:bg-zinc-50 border border-zinc-200 rounded-full text-zinc-500 transition-colors shadow-sm cursor-pointer">
                <SettingsIcon size={16} />
              </button>
            </div>

          </div>

          {/* User Name & Info block */}
          <div className="text-center sm:text-left space-y-4">
            <div className="space-y-1.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-center sm:justify-start gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black text-zinc-950">{user.display_name}</h1>
                <span className={`self-center px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1 ${isPremium ? "bg-amber-100 text-amber-700 border border-amber-200" : "bg-zinc-100 text-zinc-500 border border-zinc-200"}`}>
                  {isPremium ? <Star size={9} className="fill-amber-500 text-amber-500" /> : null}
                  {isPremium ? "Pro Member" : "Free Plan"}
                </span>
              </div>
              
              <div className="text-xs font-bold text-zinc-500 flex flex-col sm:flex-row sm:items-center justify-center sm:justify-start gap-1 sm:gap-2">
                <span>{user.email}</span>
                <span className="hidden sm:inline-block text-zinc-300">•</span>
                <span className="text-emerald-600 flex items-center justify-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Hoạt động
                </span>
              </div>
            </div>

            {/* Quick Stat Pills */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2">
              
              {/* Streak Pill */}
              <div className="flex items-center gap-3.5 bg-amber-50/30 border border-amber-100/50 rounded-2xl px-4.5 py-2.5 shadow-sm min-w-[140px]">
                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200/30 flex items-center justify-center text-amber-600 shrink-0">
                  <Flame size={16} className="fill-amber-500/10 text-amber-500" />
                </div>
                <div className="text-left">
                  <span className="text-[10px] font-black text-amber-600/90 uppercase tracking-wider block">Chuỗi học</span>
                  <span className="text-sm font-extrabold text-zinc-900 leading-tight block mt-0.5">
                    {stats?.streak || 0} Ngày
                  </span>
                </div>
              </div>

              {/* Rank Pill */}
              <div className="flex items-center gap-3.5 bg-indigo-50/30 border border-indigo-100/50 rounded-2xl px-4.5 py-2.5 shadow-sm min-w-[140px]">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200/30 flex items-center justify-center text-indigo-600 shrink-0">
                  <Globe size={16} className="text-indigo-500" />
                </div>
                <div className="text-left">
                  <span className="text-[10px] font-black text-indigo-600/90 uppercase tracking-wider block">Xếp hạng</span>
                  <span className="text-sm font-extrabold text-zinc-900 leading-tight block mt-0.5">
                    {rank ? `#${rank} Global` : "Chưa có"}
                  </span>
                </div>
              </div>

              {/* Target Pill */}
              <div className="flex items-center gap-3.5 bg-emerald-50/30 border border-emerald-100/50 rounded-2xl px-4.5 py-2.5 shadow-sm min-w-[140px]">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200/30 flex items-center justify-center text-emerald-600 shrink-0">
                  <Flag size={16} className="text-emerald-500" />
                </div>
                <div className="text-left">
                  <span className="text-[10px] font-black text-emerald-600/90 uppercase tracking-wider block">Mục tiêu</span>
                  <span className="text-sm font-extrabold text-zinc-900 leading-tight block mt-0.5">
                    {targetJLPT}
                  </span>
                </div>
              </div>

            </div>

          </div>

        </div>
      </div>

      {/* Learning Overview Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-black text-zinc-900 flex items-center gap-2 pl-2">
          Tổng quan học tập
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          
          {/* Card 1: Total EXP */}
          <div className="bg-white border border-zinc-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <TrendingUp size={20} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-zinc-400 block mb-0.5">Tổng điểm EXP</span>
              <span className="text-lg font-black text-zinc-950 leading-none block">
                {stats?.exp ? (stats.exp >= 1000 ? `${(stats.exp / 1000).toFixed(1)}k` : stats.exp) : "0"}
              </span>
            </div>
          </div>

          {/* Card 2: Accuracy */}
          <div className="bg-white border border-zinc-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 shrink-0">
              <Target size={20} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-zinc-400 block mb-0.5">Tỷ lệ chính xác</span>
              <span className="text-lg font-black text-zinc-950 leading-none block">
                {stats?.accuracy_percent ? `${stats.accuracy_percent}%` : "0%"}
              </span>
            </div>
          </div>

          {/* Card 3: Vocab Mastered */}
          <div className="bg-white border border-zinc-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <BookOpen size={20} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-zinc-400 block mb-0.5">Từ vựng đã thuộc</span>
              <span className="text-lg font-black text-zinc-950 leading-none block">
                {stats?.total_mastered?.toLocaleString() || "0"}
              </span>
            </div>
          </div>

          {/* Card 4: Total Reviews */}
          <div className="bg-white border border-zinc-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
              <BookOpen size={20} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-zinc-400 block mb-0.5">Tổng số lượt ôn tập</span>
              <span className="text-lg font-black text-zinc-950 leading-none block">
                {stats?.total_reviews?.toLocaleString() || "0"}
              </span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
