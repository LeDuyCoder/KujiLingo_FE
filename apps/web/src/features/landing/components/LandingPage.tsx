"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/features/authentication/stores/auth.store";
import { Header } from "./Header";
import { Hero } from "./Hero";
import { Science } from "./Science";
import { Crucible } from "./Crucible";
import { Curriculum } from "./Curriculum";
import { FAQ } from "./FAQ";
import { Cta } from "./Cta";
import { Footer } from "./Footer";

export const LandingPage = () => {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => setMounted(true), 0);
  }, []);

  useEffect(() => {
    if (mounted && user) {
      router.replace("/home");
    }
  }, [mounted, user, router]);

  // While checking auth state, show nothing to avoid flash
  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If user is logged in, show loading while redirecting
  if (user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <main className="flex-grow">
        <Hero />
        <Science />
        <Crucible />
        <Curriculum />
        <FAQ />
        <Cta />
      </main>
      <Footer />
    </div>
  );
};
export default LandingPage;

