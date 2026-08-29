"use client";

import React from "react";
import Link from "next/link";
import { Search, Flame, Bell, User, Menu } from "lucide-react";
import { useAuthStore } from "@/features/authentication/stores/auth.store";

interface HeaderProps {
  onMenuClick?: () => void;
}

export const Header = ({ onMenuClick }: HeaderProps) => {
  const { user } = useAuthStore();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    const handle = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(handle);
  }, []);

  const displayName = mounted && user?.display_name ? user.display_name : "...";
  const isPremium = mounted && user?.is_premium ? user.is_premium : false;
  const planStatus = isPremium ? "Pro Plan" : "Free Plan";

  return (
    <header className="h-20 bg-white border-b border-zinc-100 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10 w-full">
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
            href="/upgrade"
            className="hidden sm:inline-block text-[#b7152b] text-sm font-semibold hover:text-[#9B1C1C] transition-colors"
          >
            Upgrade Pro
          </Link>
        )}

        {/* Streak Button */}
        <div className="flex items-center gap-1 px-2.5 py-1.5 md:gap-1.5 md:px-3.5 bg-amber-50 border border-amber-200/50 rounded-full text-amber-700 text-sm font-bold shadow-sm shadow-amber-50">
          <Flame size={18} fill="currentColor" className="text-amber-500 animate-pulse" />
          <span>12</span>
        </div>

        {/* Notification Bell */}
        <button className="relative w-10 h-10 flex items-center justify-center text-zinc-500 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 rounded-full transition-colors">
          <Bell size={18} />
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-white" />
        </button>

        {/* Profile Section */}
        <div className="flex items-center gap-3 pl-3 md:pl-4 border-l border-zinc-100">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-bold text-zinc-900 leading-none">{displayName}</span>
            <span className="text-[10px] text-zinc-500 font-medium tracking-wide mt-1">{planStatus}</span>
          </div>
          
          <button className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 border border-zinc-200/60 shadow-sm">
            <User size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </header>
  );
};
