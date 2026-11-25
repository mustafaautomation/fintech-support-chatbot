"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { NUDGES, TEASER } from "@/lib/brand";

export function SiteLauncher() {
  const [open, setOpen] = useState(false);
  const [showPills, setShowPills] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [teaser, setTeaser] = useState(false);

  useEffect(() => {
    const off = window.localStorage.getItem("lumen-teaser-off") === "1";
    const timer = window.setTimeout(() => {
      if (!off) setTeaser(true);
    }, 4000);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => {
      if (window.sessionStorage.getItem("lumen-nudges-off") === "1") setDismissed(true);
      else setShowPills(true);
    }, reduced ? 0 : 1200);
    return () => window.clearTimeout(timer);
  }, []);

  function focusChat() {
    document.getElementById("live-chat")?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.dispatchEvent(new CustomEvent("lumen:focus"));
    setOpen(true);
  }

  return (
    <>
      {teaser ? (
        <div
          data-testid="launcher-teaser"
          className="fixed bottom-[88px] right-[84px] z-[2147483000] max-w-[240px] rounded-[16px] border border-border bg-surface px-3 py-2 text-[13px] shadow-[var(--shadow-card)] sm:right-[100px]"
        >
          <button
            type="button"
            className="absolute right-1 top-1 inline-flex size-6 items-center justify-center"
            aria-label="Dismiss teaser"
            onClick={() => {
              window.localStorage.setItem("lumen-teaser-off", "1");
              setTeaser(false);
            }}
          >
            <X className="size-3.5" />
          </button>
          <button
            type="button"
            className="pr-4 text-left"
            onClick={() => {
              window.dispatchEvent(
                new CustomEvent("lumen:send", {
                  detail: "I don't recognize the Night Market Electronics charge. Please dispute it.",
                }),
              );
              focusChat();
            }}
          >
            {TEASER}
          </button>
        </div>
      ) : null}
      {!dismissed && showPills ? (
        <div className="fixed bottom-[96px] right-4 z-[2147483000] flex flex-col items-end gap-2 sm:right-6">
          <button
            type="button"
            className="inline-flex size-6 items-center justify-center text-muted-foreground"
            aria-label="Dismiss suggestions"
            onClick={() => {
              window.sessionStorage.setItem("lumen-nudges-off", "1");
              setDismissed(true);
            }}
          >
            <X className="size-3.5" />
          </button>
          {NUDGES.map((nudge, index) => (
            <button
              key={nudge.label}
              type="button"
              data-testid="launcher-nudge"
              className="h-9 rounded-full border border-border bg-surface/90 px-3.5 text-[13px] font-medium shadow-[var(--shadow-card)] backdrop-blur"
              style={{ transitionDelay: `${index * 70}ms` }}
              onClick={() => {
                window.dispatchEvent(new CustomEvent("lumen:send", { detail: nudge.prompt }));
                focusChat();
              }}
            >
              {nudge.label}
            </button>
          ))}
        </div>
      ) : null}
      <button
        type="button"
        data-testid="chat-launcher"
        aria-expanded={open}
        aria-controls="lumen-chat-widget"
        aria-label={open ? "Close chat" : "Open chat with Lumen support"}
        className="fixed bottom-4 right-4 z-[2147483000] inline-flex size-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-[var(--shadow-launcher)] ring-1 ring-inset ring-white/25 hover:scale-105 sm:bottom-6 sm:right-6 sm:size-[60px]"
        onClick={focusChat}
      >
        {open ? <X className="size-[22px]" strokeWidth={2} /> : <BrandMark className="size-[22px]" />}
      </button>
    </>
  );
}
