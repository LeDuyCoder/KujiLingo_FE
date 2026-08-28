"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  GraduationCap,
  BookOpen,
  Bookmark,
  Trophy,
  ShoppingBag,
  Award,
  Settings,
  HelpCircle,
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

export const Sidebar = ({ className = "" }: SidebarProps) => {
  const pathname = usePathname();

  const navigation = [
    { name: "Home", href: "/home", icon: Home },
    { name: "Courses", href: "/courses", icon: GraduationCap },
    { name: "Dictionary", href: "/dictionary", icon: BookOpen },
    { name: "My Words", href: "/my-words", icon: Bookmark },
    { name: "Leaderboard", href: "/leaderboard", icon: Trophy },
    { name: "Shop", href: "/shop", icon: ShoppingBag },
    { name: "Achievements", href: "/achievements", icon: Award },
  ];

  const footNavigation = [
    { name: "Settings", href: "/settings", icon: Settings },
    { name: "Help", href: "/help", icon: HelpCircle },
  ];

  const isActive = (href: string) => {
    if (href === "/home" && pathname === "/") return true;
    return pathname?.startsWith(href);
  };

  return (
    <aside className={`flex flex-col w-64 bg-white border-r border-zinc-100 h-screen sticky top-0 ${className}`}>
      {/* Logo Section */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-zinc-50">
        <div className="relative w-10 h-10 flex-shrink-0 bg-[#b7152b] rounded-xl flex items-center justify-center shadow-md shadow-red-100">
          {/* Logo Icon */}
          <span className="text-white font-black text-xl tracking-tighter">K</span>
          {/* Stylized sakura/dot on the top-right corner of the logo box */}
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-300 rounded-full border border-[#b7152b]" />
        </div>
        <div className="flex flex-col">
          <span className="text-[#b7152b] text-xl font-extrabold tracking-tight leading-none">KujiLingo</span>
          <span className="text-zinc-400 text-[10px] font-medium uppercase tracking-wider mt-1">Learn Japanese</span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {navigation.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                active
                  ? "bg-red-50/70 text-[#b7152b]"
                  : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50/80"
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 2} className={active ? "text-[#b7152b]" : "text-zinc-400"} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer Navigation */}
      <div className="px-4 py-4 border-t border-zinc-50 space-y-1">
        {footNavigation.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                active
                  ? "bg-red-50/70 text-[#b7152b]"
                  : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50/80"
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 2} className={active ? "text-[#b7152b]" : "text-zinc-400"} />
              {item.name}
            </Link>
          );
        })}
      </div>
    </aside>
  );
};
