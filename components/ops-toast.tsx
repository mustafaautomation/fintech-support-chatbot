"use client";

import { useEffect, useState } from "react";

type Notice = { title: string; body: string };

export function OpsToast() {
  const [notice, setNotice] = useState<Notice | null>(null);
  useEffect(() => {
    function show(next: Notice) {
      setNotice(next);
      window.setTimeout(() => setNotice(null), 6000);
    }
    function onCustom(event: Event) {
      show((event as CustomEvent<Notice>).detail);
    }
    function onMessage(event: MessageEvent) {
      const data = event.data as { source?: string; type?: string; title?: string; body?: string } | null;
      if (data?.source === "lumen-embed" && data.type === "ops" && data.title && data.body) {
        show({ title: data.title, body: data.body });
      }
    }
    window.addEventListener("lumen:ops", onCustom);
    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("lumen:ops", onCustom);
      window.removeEventListener("message", onMessage);
    };
  }, []);
  if (!notice) return null;
  return (
    <div
      data-testid="ops-toast"
      role="status"
      className="fixed left-4 top-20 z-[2147483000] max-w-sm rounded-[16px] border border-danger/40 bg-surface p-3 shadow-[var(--shadow-widget)]"
    >
      <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-danger">{notice.title}</p>
      <p className="mt-1 text-sm">{notice.body}</p>
    </div>
  );
}
