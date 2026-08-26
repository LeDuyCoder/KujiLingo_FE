import React from "react";

export function AuthBranding() {
  return (
    <div className="hidden lg:flex w-1/2 flex-col justify-between bg-[#F8F9FA] p-8 xl:p-10 relative overflow-hidden">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <svg className="w-7 h-7 text-[#B91C1C]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0014.07 6H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z" />
        </svg>
        <span className="text-xl font-bold text-[#B91C1C]">KujiLingo</span>
      </div>

      {/* Main Content */}
      <div className="max-w-[400px] mx-auto w-full text-center">
        {/* Circle illustration */}
        <div className="w-40 h-40 xl:w-44 xl:h-44 mx-auto bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 mb-4 overflow-hidden">
          <div className="text-center text-slate-400 text-xs">
            <span className="text-3xl block mb-1">字</span>
            App Mockup
          </div>
        </div>

        <h1 className="text-3xl xl:text-4xl font-extrabold text-slate-900 mb-2 leading-tight">
          Learn Japanese <br /> Smarter.
        </h1>
        <p className="text-slate-500 text-xs xl:text-sm mb-5 leading-relaxed">
          Master Kanji, Kana, and grammar through our systematic, tactile learning approach designed for high-performance retention.
        </p>

        {/* Feature Cards */}
        <div className="space-y-2.5 text-left">
          <div className="flex items-center p-3 bg-white rounded-xl border border-red-100 shadow-sm">
            <div className="flex-shrink-0 w-9 h-9 bg-[#B91C1C] rounded-lg flex items-center justify-center text-white mr-3">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-800">Spaced Repetition</h3>
              <p className="text-[11px] text-slate-500">Our algorithm ensures you review material right before you forget it.</p>
            </div>
          </div>

          <div className="flex items-center p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
            <div className="flex-shrink-0 w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mr-3">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-800">Visual Progress</h3>
              <p className="text-[11px] text-slate-500">Track your mastery with detailed analytics and geometric progress charts.</p>
            </div>
          </div>

          <div className="flex items-center p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
            <div className="flex-shrink-0 w-9 h-9 bg-slate-700 rounded-lg flex items-center justify-center text-white mr-3">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-800">JLPT Focused</h3>
              <p className="text-[11px] text-slate-500">Structured curriculum aligned perfectly with official JLPT levels N5-N1.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center text-[10px] text-slate-400">
        <a href="#" className="hover:text-slate-600 transition-colors">Privacy Policy</a>
        <a href="#" className="hover:text-slate-600 transition-colors">Terms of Service</a>
      </div>
    </div>
  );
}
