"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <button
      type="button"
      data-testid="theme-toggle"
      className={`inline-flex size-8 items-center justify-center rounded-full text-foreground hover:bg-accent-soft ${className}`}
      aria-label="Toggle color theme"
      title="Light or dark"
      onClick={() => {
        const next = resolvedTheme === "dark" ? "light" : "dark";
        setTheme(next);
        const frame = document.getElementById("lumen-support-frame") as HTMLIFrameElement | null;
        frame?.contentWindow?.postMessage({ source: "lumen-host", type: "theme", theme: next }, "*");
      }}
    >
      <Sun strokeWidth={1.75} className="hidden size-4 dark:block" />
      <Moon strokeWidth={1.75} className="size-4 dark:hidden" />
    </button>
  );
}
