"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar, Header } from "@/features/dashboard";
import { useAuthStore } from "@/features/authentication/stores/auth.store";
import { AppDialogProvider } from "@/shared/components/ui/AppDialogProvider";
import { axiosClient } from "@/shared/api/axiosClient";
import { useLanguage } from "@/shared/i18n/language";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, updateUser } = useAuthStore();
  const setLanguage = useLanguage().setLanguage;
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const handle = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(handle);
  }, []);

  useEffect(() => {
    if (user?.preferred_language) setLanguage(user.preferred_language);
  }, [user?.preferred_language, setLanguage]);

  useEffect(() => {
    if (!mounted || !user) return;
    let active = true;
    axiosClient.get("/api/v1/auth/me").then((response) => {
      if (!active) return;
      const profile = response.data?.data;
      if (profile?.preferred_language === "vi" || profile?.preferred_language === "en") {
        setLanguage(profile.preferred_language);
        updateUser({ preferred_language: profile.preferred_language });
      }
    }).catch(() => undefined);
    return () => { active = false; };
  }, [mounted, user?.id, setLanguage, updateUser]);

  useEffect(() => {
    if (mounted && !user) {
      router.push("/login");
    }
  }, [mounted, user, router]);

  if (!mounted) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-50">
        <div className="w-10 h-10 border-4 border-[#b7152b] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isFullScreenMode = pathname?.includes("/flashcards") || pathname?.includes("/quiz") || pathname?.includes("/practice");
  const isHelpPage = pathname === "/help";
  const isAdminPage = pathname?.startsWith("/admin") ?? false;

  if (isFullScreenMode) {
    return <AppDialogProvider>{children}</AppDialogProvider>;
  }

  if (isAdminPage) {
    return <AppDialogProvider>{children}</AppDialogProvider>;
  }

  return (
    <AppDialogProvider>
    <div className="flex h-dvh w-full overflow-hidden bg-[#f6f7f8]">
      {/* Sidebar - responsive component handles its own desktop/mobile visibility */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((collapsed) => !collapsed)}
      />

      {/* Main Content Wrapper - scrolls vertically */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <Header onMenuClick={() => setIsSidebarOpen(true)} />

        {/* Dynamic Page Content */}
        <main className={`min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8 ${isHelpPage ? "lg:px-[4vw]" : "lg:px-9"}`}>
          <div className={`mx-auto w-full ${isHelpPage ? "max-w-none" : "max-w-[1440px]"}`}>
            {children}
          </div>
        </main>
      </div>
    </div>
    </AppDialogProvider>
  );
}
