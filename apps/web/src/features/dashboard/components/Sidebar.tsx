"use client";

import React, { useEffect, useState } from "react";
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
  User,
  LogOut,
  ChevronRight,
  Coins,
  Gem,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { BrandLogo } from "@/shared/components/BrandLogo";
import { useAuthStore } from "@/features/authentication/stores/auth.store";
import { axiosClient } from "@/shared/api/axiosClient";
import { useLanguage } from "@/shared/i18n/language";

interface SidebarProps {
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar = ({ className = "", isOpen = false, onClose, isCollapsed = false, onToggleCollapse }: SidebarProps) => {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { t, language } = useLanguage();
  const locale = language === "vi" ? "vi-VN" : "en-US";
  const displayName = user?.display_name?.trim() || t("sidebar.accountFallback");
  const [wallet, setWallet] = useState<{ coins: number; gems: number } | null>(null);

  useEffect(() => {
    if (!isOpen || !user?.id) return;

    let active = true;
    axiosClient.get("/api/v1/shop/wallet")
      .then((response) => {
        const data = response.data?.data;
        if (!active || !response.data?.success || !data) return;
        setWallet({
          coins: Number(data.coins ?? 0),
          gems: Number(data.gems ?? 0),
        });
      })
      .catch((error) => {
        console.error("Error fetching wallet for mobile navigation:", error);
      });

    return () => {
      active = false;
    };
  }, [isOpen, user?.id]);

  const primaryNavigation = [
    { name: "nav.home", href: "/home", icon: Home },
    { name: "nav.courses", href: "/courses", icon: GraduationCap },
    { name: "nav.dictionary", href: "/dictionary", icon: BookOpen },
    { name: "nav.myWords", href: "/my-words", icon: Bookmark },
  ];

  const secondaryNavigation = [
    { name: "nav.leaderboard", href: "/leaderboard", icon: Trophy },
    { name: "nav.shop", href: "/shop", icon: ShoppingBag },
    { name: "nav.achievements", href: "/achievements", icon: Award },
  ];

  const adminNavigation = user?.role === "admin"
    ? [{ name: "nav.admin", href: "/admin", icon: Settings }]
    : [];

  const footNavigation = [
    { name: "nav.settings", href: "/settings", icon: Settings },
    { name: "nav.help", href: "/help", icon: HelpCircle },
  ];

  const isActive = (href: string) => {
    if (href === "/home" && pathname === "/") return true;
    return pathname?.startsWith(href);
  };

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  const sidebarContent = (
    <aside className={`flex h-dvh min-h-0 w-[80vw] max-w-[300px] flex-col bg-white transition-[width] duration-200 ease-out lg:h-screen ${isCollapsed ? "lg:w-[72px]" : "lg:w-[252px]"} ${className}`}>
      {/* Logo Section */}
      <div className={`flex shrink-0 items-center justify-between px-4 py-4 lg:px-3 ${isCollapsed ? "lg:flex-col lg:gap-2 lg:py-3" : "lg:py-5"}`}>
        <BrandLogo showTagline compactOnLarge={isCollapsed} />
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? t("sidebar.expand") : t("sidebar.collapse")}
            aria-expanded={!isCollapsed}
            title={isCollapsed ? t("sidebar.expand") : t("sidebar.collapse")}
            className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b7152b] lg:flex"
          >
            {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        )}
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
      <nav aria-label={t("sidebar.mainNavigation")} className={`min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-2 lg:space-y-4 lg:px-3 ${isCollapsed ? "lg:py-2" : "lg:py-5"}`}>
        <div className="space-y-1">
          {primaryNavigation.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={handleNavClick}
                aria-label={t(item.name)}
                title={isCollapsed ? t(item.name) : undefined}
                className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-[13px] font-semibold transition-colors ${isCollapsed ? "lg:justify-center lg:px-0" : ""} ${
                  active
                    ? "bg-red-50/80 text-[#b7152b]"
                    : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
                }`}
              >
                <Icon size={17} strokeWidth={active ? 2.3 : 1.9} className={`shrink-0 ${active ? "text-[#b7152b]" : "text-zinc-400"}`} />
                <span className={`min-w-0 flex-1 ${isCollapsed ? "lg:sr-only" : ""}`}>{t(item.name)}</span>
              </Link>
            );
          })}
        </div>

        <div className="space-y-1 border-t border-zinc-100 pt-3 lg:border-0 lg:pt-0">
          {secondaryNavigation.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={handleNavClick}
                aria-label={t(item.name)}
                title={isCollapsed ? t(item.name) : undefined}
                className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-[13px] font-semibold transition-colors ${isCollapsed ? "lg:justify-center lg:px-0" : ""} ${
                  active
                    ? "bg-red-50/80 text-[#b7152b]"
                    : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
                }`}
              >
                <Icon size={17} strokeWidth={active ? 2.3 : 1.9} className={`shrink-0 ${active ? "text-[#b7152b]" : "text-zinc-400"}`} />
                <span className={isCollapsed ? "lg:sr-only" : ""}>{t(item.name)}</span>
              </Link>
            );
          })}
        </div>

        {adminNavigation.length > 0 && (
          <div className="space-y-1 border-t border-zinc-100 pt-3 lg:pt-2">
            {adminNavigation.map((item) => {
              const active = pathname?.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} onClick={handleNavClick} aria-label={t(item.name)} title={isCollapsed ? t(item.name) : undefined} className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-[13px] font-semibold transition-colors ${isCollapsed ? "lg:justify-center lg:px-0" : ""} ${active ? "bg-red-50/80 text-[#b7152b]" : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"}`}>
                  <Icon size={17} strokeWidth={active ? 2.3 : 1.9} className={`shrink-0 ${active ? "text-[#b7152b]" : "text-zinc-400"}`} />
                  <span className={`min-w-0 flex-1 ${isCollapsed ? "lg:sr-only" : ""}`}>{t(item.name)}</span>
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      {/* Pinned bottom navigation */}
      <div className="shrink-0 space-y-1 border-t border-zinc-100 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 lg:space-y-1 lg:px-4 lg:py-4">
        <section className="shrink-0 px-3 pb-1 lg:hidden">
          <Link
            href="/profile"
            onClick={handleNavClick}
            aria-label={t("sidebar.accountDetails")
              .replace("{name}", displayName)
              .replace("{coins}", (wallet?.coins ?? 0).toLocaleString(locale))
              .replace("{gems}", (wallet?.gems ?? 0).toLocaleString(locale))}
            className="flex min-h-11 min-w-0 items-center gap-2 rounded-xl transition-colors hover:bg-zinc-50"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-50 text-sm font-bold text-[#b7152b]">
              {!user?.display_name?.trim() ? <User size={17} /> : displayName.charAt(0).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold leading-tight text-zinc-900">{displayName}</span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-1.5 text-[10px] font-medium tabular-nums text-zinc-500">
              <span className="inline-flex items-center gap-1 whitespace-nowrap">
                <Coins size={12} className="text-amber-500" />
                {(wallet?.coins ?? 0).toLocaleString(locale)}
              </span>
              <span className="inline-flex items-center gap-1 whitespace-nowrap">
                <Gem size={12} className="text-[#b7152b]" />
                {(wallet?.gems ?? 0).toLocaleString(locale)}
              </span>
            </span>
            <ChevronRight size={15} className="shrink-0 text-zinc-400" />
          </Link>
        </section>
        {footNavigation.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={handleNavClick}
              aria-label={t(item.name)}
              title={isCollapsed ? t(item.name) : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-[13px] font-semibold transition-colors ${isCollapsed ? "lg:justify-center lg:px-0" : ""} ${
                active
                  ? "bg-red-50/80 text-[#b7152b]"
                  : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
              }`}
            >
              <Icon size={17} strokeWidth={active ? 2.3 : 1.9} className={`shrink-0 ${active ? "text-[#b7152b]" : "text-zinc-400"}`} />
              <span className={`min-w-0 flex-1 ${isCollapsed ? "lg:sr-only" : ""}`}>{t(item.name)}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => {
            logout();
            handleNavClick();
          }}
          className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-[13px] font-semibold text-zinc-500 transition-colors hover:bg-rose-50 hover:text-rose-600 lg:hidden"
        >
          <LogOut size={18} className="shrink-0 text-zinc-400" />
          {t("nav.logout")}
        </button>
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
          className={`absolute left-0 top-0 h-full w-[80vw] max-w-[300px] shadow-2xl transition-transform duration-300 ease-out ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {sidebarContent}
        </div>
      </div>
    </>
  );
};
