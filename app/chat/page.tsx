import { Suspense } from "react";
import { ChatDesk } from "@/components/chat-desk";

export default function ChatPage() {
  return (
    <Suspense fallback={<p className="p-8 text-sm text-muted-foreground">Opening the demo chat…</p>}>
      <ChatDesk />
    </Suspense>
  );
}
