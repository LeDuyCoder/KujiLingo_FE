"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

export type SelectOption = { value: string; label: string };

type SelectProps = {
  value: string;
  options: SelectOption[];
  onValueChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
};

type MenuPosition = { left: number; top: number; width: number; maxHeight: number };

export function Select({
  value,
  options,
  onValueChange,
  className = "",
  disabled = false,
  ariaLabel,
}: SelectProps) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [position, setPosition] = useState<MenuPosition | null>(null);
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
  const selected = options[selectedIndex];

  useEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const gap = 6;
      const edge = 12;
      const availableWidth = Math.max(0, window.innerWidth - edge * 2);
      const width = Math.min(Math.max(rect.width, 200), availableWidth);
      const left = Math.min(Math.max(rect.left, edge), window.innerWidth - edge - width);
      const spaceBelow = window.innerHeight - rect.bottom - edge - gap;
      const spaceAbove = rect.top - edge - gap;
      const showBelow = spaceBelow >= Math.min(180, spaceAbove) || spaceBelow >= spaceAbove;
      const maxHeight = Math.max(100, Math.min(240, showBelow ? spaceBelow : spaceAbove));
      const top = showBelow ? rect.bottom + gap : Math.max(edge, rect.top - gap - maxHeight);
      setPosition({ left, top, width, maxHeight });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    const closeOnOutside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !document.getElementById(`${id}-listbox`)?.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", closeOnOutside);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      document.removeEventListener("pointerdown", closeOnOutside);
    };
  }, [id, open]);

  useEffect(() => {
    if (open) optionRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  const openMenu = (index = selectedIndex) => {
    setActiveIndex(index);
    setOpen(true);
  };

  const choose = (index: number) => {
    const option = options[index];
    if (!option) return;
    onValueChange(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) openMenu();
      else setActiveIndex((index) => Math.min(index + 1, options.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) openMenu();
      else setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Home" && open) {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === "End" && open) {
      event.preventDefault();
      setActiveIndex(options.length - 1);
    } else if ((event.key === "Enter" || event.key === " ") && open) {
      event.preventDefault();
      choose(activeIndex);
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className="relative flex min-w-0">
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-listbox`}
        disabled={disabled || options.length === 0}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={handleKeyDown}
        className={`inline-flex h-10 min-w-0 cursor-pointer items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-3 text-left text-sm font-medium text-zinc-700 shadow-sm outline-none transition hover:border-zinc-300 focus:border-red-300 focus:ring-4 focus:ring-red-100 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      >
        <span className="truncate">{selected?.label ?? "Chọn mục"}</span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={`shrink-0 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && position && typeof document !== "undefined"
        ? createPortal(
            <div
              id={`${id}-listbox`}
              role="listbox"
              aria-label={ariaLabel ?? selected?.label}
              className="fixed z-[100] overflow-y-auto rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl shadow-zinc-900/10 ring-1 ring-black/5"
              style={{
                left: position.left,
                top: position.top,
                width: position.width,
                maxHeight: position.maxHeight,
              }}
            >
              {options.map((option, index) => {
                const isSelected = option.value === value;
                const isActive = index === activeIndex;
                return (
                  <button
                    key={option.value}
                    ref={(node) => { optionRefs.current[index] = node; }}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => choose(index)}
                    className={`flex min-h-10 w-full items-center justify-between gap-3 rounded-lg px-3 text-left text-sm transition-colors ${
                      isSelected
                        ? "bg-red-50 font-bold text-[#b7152b]"
                        : isActive
                          ? "bg-zinc-100 text-zinc-900"
                          : "text-zinc-700 hover:bg-zinc-50"
                    }`}
                  >
                    <span>{option.label}</span>
                    {isSelected && <Check size={15} aria-hidden="true" />}
                  </button>
                );
              })}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
