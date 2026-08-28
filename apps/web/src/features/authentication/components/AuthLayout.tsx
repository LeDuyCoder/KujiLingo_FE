import React from "react";
import { FeatureBanner } from "./FeatureBanner";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-white font-sans">
      {/* Left side banner (hidden on mobile) */}
      <div className="hidden md:block w-full md:w-[420px] lg:w-[480px] xl:w-[540px] shrink-0 min-h-screen">
        <FeatureBanner />
      </div>

      {/* Right side form container */}
      <div className="flex-1 flex flex-col justify-center items-center py-12 px-6 md:px-12 bg-white">
        {/* Mobile-only Logo */}
        <div className="md:hidden flex items-center gap-3 mb-12">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[#b7152b] text-white font-bold text-xl">
            <span className="font-sans">文A</span>
          </div>
          <span className="text-3xl font-extrabold tracking-tight text-zinc-900">
            Kuji<span className="text-[#b7152b]">Lingo</span>
          </span>
        </div>

        {/* Children (Form) */}
        {children}
      </div>
    </div>
  );
};