import React from "react";
import { Input } from "@/components/ui/Input";

export interface TopbarProps extends React.HTMLAttributes<HTMLElement> {}

export const Topbar = React.forwardRef<HTMLElement, TopbarProps>(
  ({ className = "", ...props }, ref) => {
    return (
      <header
        ref={ref}
        className={`h-16 shrink-0 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-8 ${className}`}
        {...props}
      >
        {/* Left Side: Search */}
        <div className="w-full max-w-sm">
          <Input
            type="search"
            placeholder="Search courses, words..."
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            }
            className="h-10 bg-slate-50 focus:bg-white"
          />
        </div>

        {/* Right Side: Actions & Profile */}
        <div className="flex items-center gap-4 pl-4 ml-auto">
          <button className="text-slate-400 hover:text-slate-600 transition-colors focus:outline-none relative">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
            {/* Notification Dot */}
            <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-[#b01e28] rounded-full border border-white"></span>
          </button>
          
          <div className="w-9 h-9 rounded-full bg-slate-200 border border-slate-300 overflow-hidden cursor-pointer flex items-center justify-center text-slate-500 hover:opacity-90 transition-opacity">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="5" />
              <path d="M20 21a8 8 0 0 0-16 0" />
            </svg>
          </div>
        </div>
      </header>
    );
  }
);
Topbar.displayName = "Topbar";
