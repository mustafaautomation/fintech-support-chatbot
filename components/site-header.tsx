"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandMark } from "@/components/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header
      className={`sticky top-0 z-40 flex h-16 items-center justify-between gap-3 px-4 sm:px-6 ${
        scrolled ? "border-b border-border bg-surface/80 backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <Link href="/" className="inline-flex items-center gap-2 text-[15px] font-semibold tracking-[-0.02em]">
        <BrandMark className="size-5" />
        Lumen
      </Link>
      <nav className="flex items-center gap-1 text-[13px] sm:gap-2">
        <Link href="/#how" className="hidden rounded-full px-3 py-2 hover:bg-accent-soft sm:inline">
          How it works
        </Link>
        <Link href="/chat" className="rounded-full px-3 py-2 hover:bg-accent-soft">
          Live chat
        </Link>
        <Link href="/admin" className="rounded-full px-3 py-2 hover:bg-accent-soft">
          Admin
        </Link>
        <Link href="/embed-demo" className="hidden rounded-full px-3 py-2 hover:bg-accent-soft md:inline">
          Embed
        </Link>
        <button
          type="button"
          className="inline-flex h-9 items-center rounded-full bg-accent px-3 text-[13px] font-medium text-accent-foreground"
          onClick={() => {
            document.getElementById("live-chat")?.scrollIntoView({ behavior: "smooth", block: "center" });
            window.dispatchEvent(new CustomEvent("lumen:focus"));
          }}
        >
          Open the desk
        </button>
        <ThemeToggle />
      </nav>
    </header>
  );
}
