"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import {
  Activity,
  ArrowLeft,
  Award,
  BookOpen,
  ChevronRight,
  LayoutDashboard,
  Languages,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Package,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useAuthStore } from "@/features/authentication/stores/auth.store";
import { BrandLogo } from "@/shared/components/BrandLogo";
import { useLanguage } from "@/shared/i18n/language";
import "./admin.css";

const navigationGroups: { label: string; items: { href: string; label: string; icon: LucideIcon; exact?: boolean }[] }[] = [
  {
    label: "admin.workspace",
    items: [{ href: "/admin", label: "admin.overview", icon: LayoutDashboard, exact: true }],
  },
  {
    label: "admin.management",
    items: [{ href: "/admin/users", label: "admin.users", icon: Users }],
  },
  {
    label: "admin.learning",
    items: [
      { href: "/admin/content", label: "admin.courses", icon: BookOpen },
      { href: "/admin/library", label: "admin.library", icon: Languages },
      { href: "/admin/achievements", label: "admin.achievements", icon: Award },
    ],
  },
  {
    label: "admin.commerce",
    items: [{ href: "/admin/shop", label: "admin.shop", icon: Package }],
  },
  {
    label: "admin.system",
    items: [{ href: "/admin/audit", label: "admin.audit", icon: Activity }],
  },
];

function isCurrentRoute(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const mobileNavDrag = useRef<{ pointerId: number; startX: number; startY: number; startScroll: number; moved: boolean } | null>(null);
  const suppressNavClick = useRef(false);

  const handleMobileNavPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== "touch" || event.button !== 0) return;
    mobileNavDrag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startScroll: event.currentTarget.scrollLeft,
      moved: false,
    };
  };

  const handleMobileNavPointerMove = (event: PointerEvent<HTMLElement>) => {
    const drag = mobileNavDrag.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const deltaX = drag.startX - event.clientX;
    const deltaY = drag.startY - event.clientY;
    if (Math.abs(deltaX) < 6 || Math.abs(deltaX) <= Math.abs(deltaY)) return;
    if (!drag.moved) event.currentTarget.setPointerCapture(event.pointerId);
    drag.moved = true;
    event.currentTarget.scrollLeft = drag.startScroll + deltaX;
  };

  const handleMobileNavPointerUp = (event: PointerEvent<HTMLElement>) => {
    const drag = mobileNavDrag.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    mobileNavDrag.current = null;
    if (drag.moved) {
      suppressNavClick.current = true;
      window.setTimeout(() => { suppressNavClick.current = false; }, 0);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace("/login");
    else if (user.role !== "admin") router.replace("/home");
  }, [ready, user, router]);

  const currentItem = navigationGroups.flatMap((group) => group.items)
    .filter((item) => isCurrentRoute(pathname, item.href, item.exact))
    .sort((a, b) => b.href.length - a.href.length)[0];

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  if (!ready || !user || user.role !== "admin") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#f7f7f8]">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#b7152b] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="admin-shell flex h-dvh min-w-0 overflow-hidden bg-[#f6f7f8] text-zinc-900">
      <aside className={`hidden shrink-0 flex-col border-r border-zinc-200/80 bg-white transition-[width] duration-200 ease-out lg:flex ${isSidebarCollapsed ? "w-[72px]" : "w-[252px]"}`}>
        <div className={`border-b border-zinc-100 py-5 ${isSidebarCollapsed ? "flex flex-col items-center gap-3 px-3" : "px-5"}`}>
          <div className={`flex w-full items-center ${isSidebarCollapsed ? "flex-col justify-center gap-2" : "justify-between"}`}>
            <BrandLogo size="small" compactOnLarge={isSidebarCollapsed} />
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed((collapsed) => !collapsed)}
              aria-label={isSidebarCollapsed ? t("admin.expandNav") : t("admin.collapseNav")}
              aria-expanded={!isSidebarCollapsed}
              title={isSidebarCollapsed ? t("admin.expandNav") : t("admin.collapseNav")}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b7152b]"
            >
              {isSidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
          </div>
          <div className={`flex items-center gap-2 rounded-xl bg-red-50 text-[#b7152b] ${isSidebarCollapsed ? "h-9 w-9 justify-center" : "mt-5 w-full px-3 py-2.5"}`}>
            <ShieldCheck size={16} />
            {!isSidebarCollapsed && <span className="text-xs font-bold tracking-wide">{t("admin.console")}</span>}
          </div>
        </div>

        <nav aria-label={t("admin.navigation")} className={`admin-sidebar-nav min-h-0 flex-1 overflow-y-auto px-3 py-5 ${isSidebarCollapsed ? "space-y-4" : "space-y-5"}`}>
          {navigationGroups.map((group) => (
            <section key={group.label}>
              <h2 className={`px-3 pb-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-zinc-600 ${isSidebarCollapsed ? "sr-only" : ""}`}>
                {t(group.label)}
              </h2>
              <div className="space-y-1">
                {group.items.map(({ href, label, icon: Icon, exact }) => {
                  const active = isCurrentRoute(pathname, href, exact);
                  return (
                    <Link
                      key={href}
                      href={href}
                      aria-current={active ? "page" : undefined}
                      aria-label={t(label)}
                      title={isSidebarCollapsed ? t(label) : undefined}
                      className={`group flex min-h-11 items-center gap-3 rounded-lg px-3 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b7152b] focus-visible:ring-offset-2 ${isSidebarCollapsed ? "justify-center px-0" : ""} ${
                        active
                          ? "bg-red-50 text-[#b7152b]"
                          : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                      }`}
                    >
                      <Icon size={17} strokeWidth={active ? 2.3 : 1.9} className={active ? "text-[#b7152b]" : "text-zinc-600 group-hover:text-zinc-600"} />
                      <span className={`min-w-0 flex-1 ${isSidebarCollapsed ? "sr-only" : ""}`}>{t(label)}</span>
                      {active && !isSidebarCollapsed && <span className="h-1.5 w-1.5 rounded-full bg-[#b7152b]" />}
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </nav>

        <div className="border-t border-zinc-100 p-4">
          <div className={`mb-3 flex min-w-0 items-center gap-3 px-2 ${isSidebarCollapsed ? "justify-center" : ""}`}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-extrabold text-zinc-600">
              {(user.display_name || user.email || "A").slice(0, 1).toUpperCase()}
            </span>
            <span className={`min-w-0 flex-1 ${isSidebarCollapsed ? "sr-only" : ""}`}>
              <span className="block truncate text-xs font-bold text-zinc-800">{user.display_name || t("admin.role")}</span>
              <span className="mt-0.5 block truncate text-[11px] text-zinc-600">{user.email}</span>
            </span>
          </div>
          <button onClick={handleLogout} aria-label={t("admin.logout")} title={isSidebarCollapsed ? t("admin.logout") : undefined} className={`flex h-11 w-full items-center gap-3 rounded-lg px-3 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-50 hover:text-[#b7152b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b7152b] focus-visible:ring-offset-2 ${isSidebarCollapsed ? "justify-center px-0" : ""}`}>
            <LogOut size={16} />
            {!isSidebarCollapsed && t("admin.logout")}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="shrink-0 border-b border-zinc-200/80 bg-white">
          <div className="flex h-[62px] items-center justify-between px-4 sm:px-6 lg:px-9">
            <div className="flex min-w-0 items-center gap-3">
              <div className="lg:hidden"><BrandLogo size="small" /></div>
              <ChevronRight size={15} className="hidden text-zinc-300 lg:block" />
              <div className="hidden min-w-0 lg:block">
                <p className="truncate text-sm font-bold text-zinc-800">{currentItem ? t(currentItem.label) : "Admin"}</p>
                <p className="text-[11px] text-zinc-600">{t("admin.subtitle")}</p>
              </div>
              <span className="lg:hidden truncate text-xs font-semibold text-zinc-600">{currentItem ? t(currentItem.label) : "Admin"}</span>
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:gap-4">
              <Link href="/home" className="hidden items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-900 sm:inline-flex">
                <ArrowLeft size={15} />
                {t("admin.backWebsite")}
              </Link>
              <span className="hidden h-7 w-px bg-zinc-200 sm:block" />
              <span className="hidden text-right md:block">
                <span className="block text-xs font-bold text-zinc-800">{user.display_name || t("admin.role")}</span>
                <span className="block text-[10px] text-zinc-600">{t("admin.role")}</span>
              </span>
              <button onClick={handleLogout} aria-label={t("admin.logout")} title={t("admin.logout")} className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 transition hover:border-red-100 hover:bg-red-50 hover:text-[#b7152b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b7152b] focus-visible:ring-offset-2">
                <LogOut size={16} />
              </button>
            </div>
          </div>
          <nav
            aria-label={t("admin.navigationMobile")}
            className="admin-mobile-nav flex w-full min-w-0 max-w-full flex-nowrap gap-1 overflow-x-auto overflow-y-hidden border-t border-zinc-100 px-3 py-2 lg:hidden"
            onPointerDown={handleMobileNavPointerDown}
            onPointerMove={handleMobileNavPointerMove}
            onPointerUp={handleMobileNavPointerUp}
            onPointerCancel={handleMobileNavPointerUp}
            onClickCapture={(event) => {
              if (!suppressNavClick.current) return;
              event.preventDefault();
              event.stopPropagation();
              suppressNavClick.current = false;
            }}
          >
            {navigationGroups.flatMap((group) => group.items).map(({ href, label, icon: Icon, exact }) => {
              const active = isCurrentRoute(pathname, href, exact);
              return (
                <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b7152b] ${active ? "bg-red-50 text-[#b7152b]" : "text-zinc-600 hover:bg-zinc-50"}`}>
                  <Icon size={15} />{t(label)}
                </Link>
              );
            })}
          </nav>
        </header>

        <main className="admin-content min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-9 lg:py-8">
          <div className="mx-auto w-full max-w-[1440px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
