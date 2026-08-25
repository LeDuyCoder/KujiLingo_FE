import React from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export interface AppLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const AppLayout = React.forwardRef<HTMLDivElement, AppLayoutProps>(
  ({ children, className = "", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`flex h-screen w-full bg-[#F9FAFB] font-sans text-slate-900 overflow-hidden ${className}`}
        {...props}
      >
        <Sidebar className="hidden lg:flex" />
        
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar />
          
          <main className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="mx-auto w-full max-w-7xl">
              {children}
            </div>
          </main>
        </div>
      </div>
    );
  }
);
AppLayout.displayName = "AppLayout";
