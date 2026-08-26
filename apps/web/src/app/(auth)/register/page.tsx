import React from "react";
import { AuthBranding } from "@/features/authentication/components/AuthBranding";
import { RegisterForm } from "@/features/authentication/components/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="h-screen w-full flex font-sans text-slate-900 bg-white overflow-hidden select-none">
      
      {/* LEFT COLUMN - BRANDING & FEATURES */}
      <AuthBranding />

      {/* RIGHT COLUMN - REGISTER FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 xl:p-12 overflow-y-auto">
        <RegisterForm />
      </div>
      
    </div>
  );
}
