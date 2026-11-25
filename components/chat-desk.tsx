"use client";

import { Suspense, useEffect } from "react";
import { LumenCard } from "@/components/lumen-card";
import { SiteHeader } from "@/components/site-header";
import { SupportChat } from "@/components/support-chat";

function ChatSurface({ embedded }: { embedded: boolean }) {
  useEffect(() => {
    function onFocus() {
      document.querySelector<HTMLTextAreaElement>('[data-testid="composer-input"]')?.focus();
    }
    window.addEventListener("lumen:focus", onFocus);
    return () => window.removeEventListener("lumen:focus", onFocus);
  }, []);
  if (embedded) return <SupportChat variant="embed" autoFocus />;
  return (
    <div className="min-h-dvh bg-background">
      <div className="hidden sm:block">
        <SiteHeader />
      </div>
      <div className="mx-auto flex w-full max-w-5xl items-center justify-center gap-10 sm:px-6 sm:py-8">
        <div className="hidden max-w-xs flex-1 flex-col gap-4 lg:flex">
          <LumenCard />
          <p className="text-sm leading-6 text-muted-foreground">
            Jordan Hale · Halden Bay. Account actions wait for the demo code. Full card numbers stay masked.
          </p>
        </div>
        <SupportChat variant="panel" autoFocus />
      </div>
    </div>
  );
}

export function ChatDesk({ embedded = false }: { embedded?: boolean }) {
  return (
    <Suspense fallback={<p className="p-4 text-sm text-muted-foreground">Opening Lumen support…</p>}>
      <ChatSurface embedded={embedded} />
    </Suspense>
  );
}
