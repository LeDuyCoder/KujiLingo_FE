import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost";
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", icon, children, disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kuji-red disabled:pointer-events-none disabled:opacity-50";
    
    const variants = {
      primary: "bg-kuji-red text-white hover:bg-kuji-red-hover shadow-sm",
      outline: "border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900 text-slate-700",
      ghost: "hover:bg-slate-100 hover:text-slate-900 text-slate-700",
    };

    const sizes = "h-10 px-4 py-2";

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`${baseStyles} ${variants[variant]} ${sizes} ${className}`}
        {...props}
      >
        {icon && <span className="mr-2 h-4 w-4 inline-flex items-center justify-center">{icon}</span>}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
