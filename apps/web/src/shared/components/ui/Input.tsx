import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = ({ icon, rightElement, className = "", ...props }: InputProps) => {
  return (
    <div className="relative w-full">
      {icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
          {icon}
        </div>
      )}
      <input
        className={`flex h-12 w-full rounded-xl border border-solid border-zinc-300 bg-white px-4 text-base ${
          icon ? "pl-11" : ""
        } ${
          rightElement ? "pr-11" : ""
        } transition-all duration-200 focus:border-[#b7152b] focus:ring-1 focus:ring-[#b7152b] focus:outline-none ${className}`}
        {...props}
      />
      {rightElement && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
          {rightElement}
        </div>
      )}
    </div>
  );
};
