import React from "react";
import Link from "next/link";

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl h-20 items-center justify-between px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#b7152b] text-white font-bold text-xl shadow-md shadow-red-100 group-hover:scale-105 transition-transform duration-300">
            <span className="text-sm font-sans">文A</span>
          </div>
          <span className="text-2xl font-bold tracking-tight text-zinc-900">
            Kuji<span className="text-[#b7152b]">Lingo</span>
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="#methodology"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            Methodology
          </Link>
          <Link
            href="#arena"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            The Arena
          </Link>
          <Link
            href="#curriculum"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            Curriculum
          </Link>
          <Link
            href="#faq"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            FAQ
          </Link>
        </nav>

        {/* CTA Button */}
        <div className="flex items-center gap-4">
          <Link href="/login">
            <button className="flex h-10 items-center justify-center rounded-full bg-[#b7152b] text-white px-6 font-medium text-sm hover:bg-[#a01226] active:scale-[0.98] transition-all cursor-pointer shadow-md shadow-red-100">
              Log In
            </button>
          </Link>
        </div>
      </div>
    </header>
  );
};
