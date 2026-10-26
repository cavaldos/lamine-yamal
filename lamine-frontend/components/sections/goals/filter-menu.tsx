"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "@/components/ui/icons";

// A compact button that opens a popover holding the filter controls.
export default function FilterMenu({
  label,
  summary,
  children,
}: {
  label: string;
  summary: string;
  children: React.ReactNode;
}) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="hud-label flex items-center gap-3 border border-line bg-bg-raised px-3 py-2 text-muted transition-colors hover:border-line-strong hover:text-ink focus-visible:border-accent focus-visible:outline-none aria-expanded:border-line-strong aria-expanded:text-ink"
      >
        <span className="text-faint">{label}</span>
        <span className="truncate">{summary}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-faint transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          id={id}
          role="dialog"
          aria-label={label}
          className="absolute top-full left-0 z-40 mt-1 flex w-max max-w-[calc(100vw-3rem)] flex-col gap-3 border border-line-strong bg-bg-raised p-4 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.6)]"
        >
          {children}
        </div>
      )}
    </div>
  );
}
