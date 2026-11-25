import { Suspense } from "react";
import { ChatDesk } from "@/components/chat-desk";

export default function EmbedPage() {
  return (
    <Suspense fallback={<p className="p-4 text-sm">Opening Lumen support…</p>}>
      <ChatDesk embedded />
    </Suspense>
  );
}
