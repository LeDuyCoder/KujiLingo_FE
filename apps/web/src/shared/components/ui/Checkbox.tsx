import React from "react";

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Checkbox = ({ label, className = "", ...props }: CheckboxProps) => {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        className={`h-4 w-4 accent-[#b7152b] ${className}`}
        {...props}
      />
      {label && <span className="text-sm text-zinc-600">{label}</span>}
    </label>
  );
};
