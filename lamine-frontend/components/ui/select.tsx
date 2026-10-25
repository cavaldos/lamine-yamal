"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "@/components/ui/icons";

// A themed listbox in place of the native <select>, whose popup the OS draws.
export default function Select({
  label,
  items,
  value,
  onChange,
  className = "",
}: {
  label: string;
  items: string[];
  value: number;
  onChange: (i: number) => void;
  className?: string;
}) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(value);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const show = () => {
    setActive(value);
    setOpen(true);
  };
  const pick = (i: number) => {
    onChange(i);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
      case "ArrowUp": {
        e.preventDefault();
        if (!open) return show();
        const step = e.key === "ArrowDown" ? 1 : -1;
        setActive((a) => (a + step + items.length) % items.length);
        break;
      }
      case "Home":
      case "End":
        if (!open) return;
        e.preventDefault();
        setActive(e.key === "Home" ? 0 : items.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (open) pick(active);
        else show();
        break;
      case "Escape":
        if (open) {
          e.preventDefault();
          e.stopPropagation();
          setOpen(false);
        }
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  };

  return (
    <div ref={root} className={`relative ${className}`}>
      <button
        type="button"
        role="combobox"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-activedescendant={open ? `${id}-${active}` : undefined}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onKeyDown}
        className="hud-label flex h-full w-full items-center justify-between gap-3 border border-line bg-bg-raised pr-3 pl-3 text-left text-muted transition-colors hover:border-line-strong hover:text-ink focus-visible:border-accent focus-visible:outline-none aria-expanded:border-line-strong aria-expanded:text-ink"
      >
        <span className="truncate">{items[value]}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-faint transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <ul
          id={`${id}-list`}
          role="listbox"
          aria-label={label}
          className="thin-scroll absolute top-full right-0 z-40 mt-1 max-h-72 min-w-full overflow-y-auto border border-line-strong bg-bg-raised py-1 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.6)]"
        >
          {items.map((it, i) => (
            <li
              key={it}
              id={`${id}-${i}`}
              role="option"
              aria-selected={value === i}
              data-active={active === i}
              onPointerEnter={() => setActive(i)}
              onClick={() => pick(i)}
              className="hud-label cursor-pointer px-3 py-2.5 whitespace-nowrap text-muted data-[active=true]:bg-line data-[active=true]:text-ink aria-selected:bg-invert-bg aria-selected:text-invert-fg"
            >
              {it}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
