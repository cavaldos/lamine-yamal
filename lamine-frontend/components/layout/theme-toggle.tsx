"use client";

import { Moon, Sun } from "@/components/ui/icons";
import { useDict } from "@/lib/i18n/provider";

export default function ThemeToggle() {
  const dict = useDict();
  return (
    <button
      type="button"
      aria-label={dict.nav.toggleTheme}
      onClick={() => {
        const root = document.documentElement;
        const next = root.dataset.theme === "dark" ? "light" : "dark";
        root.dataset.theme = next;
        try {
          localStorage.setItem("lamine-theme", next);
        } catch {}
        root.classList.add("theme-anim");
        setTimeout(() => root.classList.remove("theme-anim"), 400);
      }}
      className="invert-block flex w-12 items-center justify-center border-l border-line text-muted hover:text-invert-fg"
    >
      <Sun className="hidden h-4 w-4 dark:block" />
      <Moon className="h-4 w-4 dark:hidden" />
    </button>
  );
}
