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
  X,
} from "lucide-react";

interface SidebarProps {
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar = ({ className = "", isOpen = false, onClose }: SidebarProps) => {
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

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  const sidebarContent = (
    <aside className={`flex flex-col w-64 bg-white h-screen ${className}`}>
      {/* Logo Section */}
      <div className="flex items-center justify-between px-6 py-6 border-b border-zinc-50">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 flex-shrink-0 bg-[#b7152b] rounded-xl flex items-center justify-center shadow-md shadow-red-100">
            <span className="text-white font-black text-xl tracking-tighter">K</span>
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-300 rounded-full border border-[#b7152b]" />
          </div>
          <div className="flex flex-col">
            <span className="text-[#b7152b] text-xl font-extrabold tracking-tight leading-none">KujiLingo</span>
            <span className="text-zinc-400 text-[10px] font-medium uppercase tracking-wider mt-1">Learn Japanese</span>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 transition-colors"
          >
            <X size={20} />
          </button>
        )}
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
              onClick={handleNavClick}
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
              onClick={handleNavClick}
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

  return (
    <>
      {/* Desktop Sidebar - always visible on lg+ */}
      <div className="hidden lg:block border-r border-zinc-100 flex-shrink-0">
        {sidebarContent}
      </div>

      {/* Mobile Sidebar - slide-in drawer */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Backdrop overlay */}
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
        {/* Drawer panel */}
        <div
          className={`absolute left-0 top-0 h-full w-64 shadow-2xl transition-transform duration-300 ease-out ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {sidebarContent}
        </div>
      </div>
    </>
  );
};
