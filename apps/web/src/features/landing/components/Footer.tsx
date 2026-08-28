import React from "react";
import Link from "next/link";

export const Footer = () => {
  return (
    <footer className="bg-white border-t border-zinc-100 py-12">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#b7152b] text-white font-bold text-lg">
            <span className="text-[10px] font-sans">文A</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-zinc-900">
            KujiLingo
          </span>
        </div>

        {/* Links */}
        <div className="flex items-center gap-8 text-sm font-medium text-zinc-500">
          <Link href="#" className="hover:text-zinc-900 transition-colors">Privacy</Link>
          <Link href="#" className="hover:text-zinc-900 transition-colors">Terms</Link>
          <Link href="#" className="hover:text-zinc-900 transition-colors">Contact</Link>
        </div>

        {/* Copyright */}
        <p className="text-sm text-zinc-400">
          © {new Date().getFullYear()} KujiLingo. All rights reserved.
        </p>

      </div>
    </footer>
  );
};
