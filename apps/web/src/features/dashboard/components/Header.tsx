/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Search, Flame, Bell, User, Menu, Trophy, Zap, Coins, Gem, LogOut } from "lucide-react";
import { useAuthStore } from "@/features/authentication/stores/auth.store";
import { axiosClient } from "@/shared/api/axiosClient";

interface HeaderProps {
  onMenuClick?: () => void;
}

interface DashboardData {
  streak: {
    current_streak_days: number;
    longest_streak_days: number;
    is_at_risk: boolean;
  };
  daily_goal_progress: {
    minutes_studied_today: number;
    goal_minutes: number;
    percent: number;
  };
}

export const Header = ({ onMenuClick }: HeaderProps) => {
  const { user, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isPopoverVisible, setIsPopoverVisible] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [wallet, setWallet] = useState<{ coins: number; gems: number } | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [equippedItems, setEquippedItems] = useState<any[] | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Click outside dropdown logic
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchWallet = async () => {
    try {
      const res = await axiosClient.get("/api/v1/shop/wallet");
      if (res.data?.success) {
        setWallet(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching wallet inside header:", err);
    }
  };

  const toggleProfileDropdown = () => {
    const nextState = !isProfileDropdownOpen;
    setIsProfileDropdownOpen(nextState);
    if (nextState) {
      fetchWallet();
    }
  };

  useEffect(() => {
    const handle = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(handle);
  }, []);

  useEffect(() => {
    const fetchDashboardSummary = async () => {
      try {
        const [dashboardRes, equippedRes] = await Promise.all([
          axiosClient.get("/dashboard"),
          axiosClient.get("/api/v1/shop/equipped").catch(() => null)
        ]);
        if (dashboardRes.data && dashboardRes.data.success) {
          setDashboardData(dashboardRes.data.data);
        }
        if (equippedRes?.data?.success) {
          setEquippedItems(equippedRes.data.data);
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      }
    };

    if (mounted && user) {
      fetchDashboardSummary();
    }
  }, [mounted, user]);

  // Send activity ping to backend every 60 seconds to track study minutes & active streak
  useEffect(() => {
    if (!mounted || !user) return;

    const sendPing = async () => {
      // Optimization: Only ping if the browser window/tab is active and visible to the user
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return;
      }

      // Optimization: Skip ping if today's study target goal has already been fully completed (100%)
      if (dashboardData && dashboardData.daily_goal_progress.percent >= 100) {
        return;
      }

      try {
        const response = await axiosClient.post("/api/v1/statistics/ping");
        if (response.data && response.data.success && response.data.data) {
          const { streak: newStreak, minutes_studied_today: newMins, percent: newPercent } = response.data.data;
          setDashboardData((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              streak: {
                ...prev.streak,
                current_streak_days: newStreak
              },
              daily_goal_progress: {
                ...prev.daily_goal_progress,
                minutes_studied_today: newMins,
                percent: newPercent
              }
            };
          });
        }
      } catch (err) {
        console.error("Error sending activity ping:", err);
      }
    };

    // Send initial ping after 5 seconds of active session
    const initialTimeout = setTimeout(sendPing, 5000);

    const intervalId = setInterval(sendPing, 60000); // 60 seconds
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, user, dashboardData?.daily_goal_progress.percent]);

  const displayName = mounted && user?.display_name ? user.display_name : "...";
  const isPremium = mounted && user?.is_premium ? user.is_premium : false;
  const planStatus = isPremium ? "Pro Plan" : "Free Plan";

  return (
    <header className="h-20 bg-white border-b border-zinc-100 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40 w-full">
      {/* Mobile Menu Toggle & Search */}
      <div className="flex items-center flex-1 max-w-md mr-4">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="mr-3 lg:hidden p-2 text-zinc-500 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            <Menu size={22} />
          </button>
        )}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input
            type="text"
            placeholder="Tìm kiếm bài học, từ vựng..."
            className="w-full h-11 pl-11 pr-4 bg-zinc-50 border border-zinc-200 rounded-full text-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#b7152b]/10 focus:border-[#b7152b] transition-all"
          />
        </div>
      </div>

      {/* Actions & Profile */}
      <div className="flex items-center gap-3 md:gap-6">
        {/* Upgrade Pro button if not premium */}
        {!isPremium && (
          <Link
            href="/premium"
            className="hidden sm:inline-block text-[#b7152b] text-sm font-semibold hover:text-[#9B1C1C] transition-colors"
          >
            Upgrade Pro
          </Link>
        )}

        {/* Streak Button with Popover */}
        <div
          className="relative"
          onMouseEnter={() => setIsPopoverVisible(true)}
          onMouseLeave={() => setIsPopoverVisible(false)}
        >
          <button
            onClick={() => setIsPopoverVisible(!isPopoverVisible)}
            className="flex items-center gap-1 px-2.5 py-1.5 md:gap-1.5 md:px-3.5 bg-amber-50 hover:bg-amber-100/70 border border-amber-200/50 rounded-full text-amber-700 text-sm font-bold shadow-sm shadow-amber-50/30 transition-all duration-200 cursor-pointer"
          >
            <Flame size={18} fill="currentColor" className="text-amber-500" />
            <span>{dashboardData?.streak?.current_streak_days ?? 0}</span>
          </button>

          {/* Interactive Streak & Goal Balloon */}
          {isPopoverVisible && dashboardData && (
            <div className="absolute right-0 top-12 w-80 bg-white/95 backdrop-blur-md border border-zinc-100 rounded-3xl p-5 shadow-2xl z-50 animate-scale-up space-y-4">
              {/* Header section with big flame */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center shadow-inner">
                  <Flame size={32} fill="currentColor" className="text-amber-500 animate-[sway_3s_ease-in-out_infinite]" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-[#b7152b] uppercase tracking-wider block">Chuỗi liên tục</span>
                  <span className="text-2xl font-black text-zinc-950 leading-tight">
                    {dashboardData.streak.current_streak_days} Ngày
                  </span>
                </div>
              </div>

              {/* Record / Best Streak */}
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 bg-zinc-50 border border-zinc-100 rounded-2xl px-4 py-2.5">
                <Trophy size={14} className="text-yellow-500" />
                <span>Kỷ lục học tập:</span>
                <span className="text-zinc-800 ml-auto">{dashboardData.streak.longest_streak_days} ngày</span>
              </div>

              {/* Status indicator message */}
              {dashboardData.streak.is_at_risk ? (
                <div className="bg-rose-50 border border-rose-100 text-rose-700 text-[11px] font-bold rounded-2xl p-3.5 leading-relaxed">
                  🔥 Chuỗi của bạn đang gặp nguy hiểm! Hãy luyện tập ngay hôm nay để duy trì đà học tập.
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-[11px] font-bold rounded-2xl p-3.5 leading-relaxed">
                  🎉 Tuyệt vời! Chuỗi của bạn đã được bảo vệ hôm nay. Hãy duy trì thói quen học tập này!
                </div>
              )}

              <hr className="border-zinc-100" />

              {/* Daily progress tracking inside popover */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    <Zap size={11} className="text-amber-500 fill-amber-500" />
                    <span>Mục tiêu hàng ngày</span>
                  </div>
                  <span>{dashboardData.daily_goal_progress.percent}%</span>
                </div>
                <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-300"
                    style={{ width: `${dashboardData.daily_goal_progress.percent}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500">
                  <span>Hôm nay: {dashboardData.daily_goal_progress.minutes_studied_today} phút</span>
                  <span>Mục tiêu: {dashboardData.daily_goal_progress.goal_minutes} phút</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notification Bell */}
        <button className="relative w-10 h-10 flex items-center justify-center text-zinc-500 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 rounded-full transition-colors">
          <Bell size={18} />
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-white" />
        </button>

        {/* Profile Section with Dropdown Menu */}
        <div 
          ref={dropdownRef}
          className="relative pl-3 md:pl-4 border-l border-zinc-100"
        >
          <div 
            onClick={toggleProfileDropdown}
            className="flex items-center gap-3 cursor-pointer select-none"
          >
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-bold text-zinc-900 leading-none">{displayName}</span>
              <span className="text-[10px] text-zinc-500 font-medium tracking-wide mt-1">{planStatus}</span>
            </div>
            
            <button className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 border border-zinc-200/60 shadow-sm pointer-events-none relative">
              {equippedItems?.find(e => e.item_type === "AVATAR") ? (
                <img src={equippedItems.find(e => e.item_type === "AVATAR")?.image} alt="Avatar" className="w-full h-full rounded-full object-cover" />
              ) : (
                <User size={18} strokeWidth={2.5} />
              )}
              {equippedItems?.find(e => e.item_type === "FRAME") && (
                <img 
                  src={equippedItems.find(e => e.item_type === "FRAME")?.image} 
                  alt="Frame" 
                  className="absolute -inset-1.5 w-[130%] h-[130%] max-w-[130%] max-h-[130%] object-cover pointer-events-none scale-110 z-10" 
                />
              )}
            </button>
          </div>

          {/* Profile Dropdown Box */}
          {isProfileDropdownOpen && (
            <div className="absolute right-0 top-12 w-56 bg-white border border-zinc-100 rounded-2xl p-4 shadow-xl z-50 animate-scale-up space-y-3.5 text-left">
              <div>
                <span className="text-[9px] font-black text-[#b7152b] uppercase tracking-wider block">Tài khoản</span>
                <span className="text-sm font-bold text-zinc-900 leading-none block mt-0.5">{displayName}</span>
              </div>

              <hr className="border-zinc-50" />

              {/* Wallet balances */}
              <div className="space-y-2">
                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider block">Ví KujiLingo</span>
                
                {/* Coins */}
                <div className="flex items-center justify-between text-xs font-bold text-zinc-700 bg-amber-50/50 border border-amber-100/50 rounded-xl px-3 py-2">
                  <span className="flex items-center gap-1.5">
                    <Coins size={14} className="text-amber-500 fill-amber-500/10" />
                    KujiCoins
                  </span>
                  <span className="text-zinc-950 font-black">
                    {wallet ? wallet.coins.toLocaleString() : "..."}
                  </span>
                </div>

                {/* Gems */}
                <Link 
                  href="/wallet/recharge-gems"
                  onClick={() => setIsProfileDropdownOpen(false)}
                  className="flex items-center justify-between text-xs font-bold text-zinc-700 bg-red-50/30 hover:bg-red-50 border border-rose-100/50 hover:border-rose-200 rounded-xl px-3 py-2 cursor-pointer transition-colors block w-full"
                >
                  <span className="flex items-center gap-1.5">
                    <Gem size={14} className="text-[#b7152b] fill-[#b7152b]/10" />
                    KujiGems
                  </span>
                  <span className="text-zinc-950 font-black">
                    {wallet ? wallet.gems.toLocaleString() : "..."}
                  </span>
                </Link>
              </div>

              <hr className="border-zinc-50" />

              {/* Action buttons */}
              <div className="space-y-1">
                <Link href="/profile" onClick={() => setIsProfileDropdownOpen(false)}>
                  <span className="w-full h-9 px-3 hover:bg-zinc-50 rounded-xl text-zinc-700 hover:text-zinc-950 font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer">
                    <User size={13} strokeWidth={2.5} />
                    Xem trang cá nhân
                  </span>
                </Link>

                <button 
                  onClick={() => {
                    setIsProfileDropdownOpen(false);
                    logout();
                  }}
                  className="w-full h-9 px-3 hover:bg-rose-50 rounded-xl text-rose-600 hover:text-red-700 font-bold text-xs transition-colors flex items-center gap-2"
                >
                  <LogOut size={13} strokeWidth={2.5} />
                  Đăng xuất
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
