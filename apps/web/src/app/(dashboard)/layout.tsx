"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar, Header } from "@/features/dashboard";
import { useAuthStore } from "@/features/authentication/stores/auth.store";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const handle = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(handle);
  }, []);

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

  const isFullScreenMode = pathname?.includes("/flashcards") || pathname?.includes("/quiz");

  if (isFullScreenMode) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen w-full bg-zinc-50 overflow-hidden">
      {/* Sidebar - responsive component handles its own desktop/mobile visibility */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />

      {/* Main Content Wrapper - scrolls vertically */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <Header onMenuClick={() => setIsSidebarOpen(true)} />

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
          <div className="max-w-6xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
