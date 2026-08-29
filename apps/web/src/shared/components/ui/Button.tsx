import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost" | "unstyled";
}

export const Button = ({
  className = "",
  variant = "primary",
  ...props
}: ButtonProps) => {
  const hasWidthClass = className.split(" ").some(c => c.startsWith("w-") || c.startsWith("lg:w-") || c.startsWith("md:w-") || c.startsWith("sm:w-"));
  const baseClasses = `flex h-12 ${hasWidthClass ? "" : "w-full"} items-center justify-center rounded-full px-5 transition-all active:scale-[0.98] active:opacity-95 font-medium cursor-pointer`;
  const variants = {
    primary: "bg-[#b7152b] text-white hover:bg-[#a01226]",
    outline: "border border-solid border-zinc-300 hover:bg-zinc-50 text-zinc-700",
    ghost: "hover:bg-zinc-50 text-zinc-700",
    unstyled: "",
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${className}`}
      {...props}
    />
  );
};
