"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  CalendarClock,
  Headphones,
  Lock,
  Mic,
  MoreHorizontal,
  Paperclip,
  Receipt,
  RefreshCw,
  Square,
  SquarePen,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useTheme } from "next-themes";
import { BrandMark } from "@/components/brand-mark";
import { CitationRow, CopyButton, DisputeReasonForm, RichCards, ToolRows } from "@/components/chat-cards";
import { MarkdownText } from "@/components/markdown-text";
import { PortfolioDisclaimer } from "@/components/portfolio-disclaimer";
import { ThemeToggle } from "@/components/theme-toggle";
import { BRAND, CALLBACK_DAY, CALLBACK_SLOTS, GREETING, PLACEHOLDER, STARTERS, phaseForDraft } from "@/lib/brand";
import type { PublicSession } from "@/lib/demo";
import { asksForCode, deriveCards } from "@/lib/ui-cards";

type Preview = { name: string; url: string; kind: "image" | "file" };

const STORAGE_KEY = "lumen-session";
const MAX_FILE = 5 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp,application/pdf";

function IconForStarter({ name }: { name: string }) {
  const props = { className: "size-4", strokeWidth: 1.75 as const };
  if (name === "receipt") return <Receipt {...props} />;
  if (name === "calendar") return <CalendarClock {...props} />;
  if (name === "lock") return <Lock {...props} />;
  return <Headphones {...props} />;
}

export function SupportChat({
  variant = "panel",
  autoFocus = false,
}: {
  variant?: "panel" | "embed" | "frame";
  autoFocus?: boolean;
}) {
  const params = useSearchParams();
  const { setTheme } = useTheme();
  const asked = useRef(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);
  const sendLock = useRef(false);
  const queueRef = useRef<string[]>([]);
  const fileCount = useRef(0);
  const [session, setSession] = useState<PublicSession | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [streaming, setStreaming] = useState("");
  const [phase, setPhase] = useState("");
  const [stopped, setStopped] = useState(false);
  const [booting, setBooting] = useState(true);
  const [stick, setStick] = useState(true);
  const [files, setFiles] = useState<Preview[]>([]);
  const [sentFiles, setSentFiles] = useState<Record<string, Preview[]>>({});
  const [listening, setListening] = useState(false);
  const [joined, setJoined] = useState(false);
  const [feedback, setFeedback] = useState<Record<string, "up" | "down" | undefined>>({});
  const [menu, setMenu] = useState(false);
  const [drop, setDrop] = useState(false);
  const [engine, setEngine] = useState<"demo" | "live">("demo");
  const [leadOpen, setLeadOpen] = useState(false);
  const [lead, setLead] = useState({ name: "", phone: "", email: "", consent: false, saved: "" });
  const abortRef = useRef<AbortController | null>(null);
  const sessionId = session?.id;

  function adopt(next: PublicSession) {
    setSession((current) => {
      if (current && current.id === next.id && next.messages.length < current.messages.length) return current;
      return next;
    });
  }

  function showToast(text: string) {
    setToast(text);
    window.setTimeout(() => setToast(null), 4000);
  }

  const adoptRef = useRef(adopt);
  const sendRef = useRef<(text: string) => Promise<void>>(async () => {});
  useEffect(() => {
    adoptRef.current = adopt;
    sendRef.current = send;
  });

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      const stored = window.sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const response = await fetch(`/api/sessions/${stored}`);
        if (response.ok) {
          const body = (await response.json()) as { session: PublicSession };
          if (!cancelled) {
            adoptRef.current(body.session);
            setBooting(false);
          }
          return;
        }
        window.sessionStorage.removeItem(STORAGE_KEY);
      }
      const created = await fetch("/api/sessions", { method: "POST" });
      const body = (await created.json()) as { session: PublicSession };
      if (!cancelled) {
        window.sessionStorage.setItem(STORAGE_KEY, body.session.id);
        adoptRef.current(body.session);
        setBooting(false);
      }
    }
    boot().catch(() => {
      if (!cancelled) {
        setError("The chat server didn't answer. Refresh and try again.");
        setBooting(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    const source = new EventSource(`/api/sessions/${sessionId}/events`);
    source.addEventListener("session", (event) => {
      adoptRef.current(JSON.parse((event as MessageEvent).data) as PublicSession);
    });
    const poll = window.setInterval(async () => {
      const response = await fetch(`/api/sessions/${sessionId}`);
      if (!response.ok) return;
      const body = (await response.json()) as { session: PublicSession };
      adoptRef.current(body.session);
    }, 3000);
    return () => {
      source.close();
      window.clearInterval(poll);
    };
  }, [sessionId]);

  useEffect(() => {
    if (!booting && autoFocus && window.matchMedia("(min-width: 640px)").matches) {
      inputRef.current?.focus();
    }
  }, [booting, autoFocus]);

  useEffect(() => {
    if (session?.mode === "queue" || session?.mode === "agent") {
      const timer = window.setTimeout(() => setJoined(true), 800);
      return () => window.clearTimeout(timer);
    }
    const clear = window.setTimeout(() => setJoined(false), 0);
    return () => window.clearTimeout(clear);
  }, [session?.mode, session?.handoff?.id]);

  useEffect(() => {
    if (!stickRef.current) return;
    const node = logRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [session?.messages.length, streaming, sending]);

  async function resetDemo() {
    await fetch("/api/demo/reset", { method: "POST" });
    window.sessionStorage.removeItem(STORAGE_KEY);
    fileCount.current = 0;
    const created = await fetch("/api/sessions", { method: "POST" });
    const body = (await created.json()) as { session: PublicSession };
    window.sessionStorage.setItem(STORAGE_KEY, body.session.id);
    adopt(body.session);
    setError(null);
    setStreaming("");
    setDraft("");
    setFiles([]);
  }

  async function send(text: string) {
      const message = text.trim();
      if (!message) return;
      if (sendLock.current) {
        queueRef.current.push(message);
        return;
      }
      sendLock.current = true;
      setSending(true);
      setStopped(false);
      setError(null);
      setDraft("");
      setPhase(phaseForDraft(message));
      setStreaming("");
      const controller = new AbortController();
      abortRef.current = controller;
      const started = Date.now();
      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, message, stream: true }),
          signal: controller.signal,
        });
        if (!response.ok || !response.body) {
          const body = (await response.json().catch(() => null)) as { error?: string } | null;
          setError(body?.error ?? "The message didn't send.");
          setDraft(message);
          return;
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let streamed = "";
        let doneSession: PublicSession | null = null;
        while (true) {
          const chunk = await reader.read();
          if (chunk.done) break;
          buffer += decoder.decode(chunk.value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() ?? "";
          for (const part of parts) {
            const event = part.match(/^event: (.+)$/m)?.[1];
            const data = part.match(/^data: (.+)$/m)?.[1];
            if (!data) continue;
            const payload = JSON.parse(data) as { text?: string; session?: PublicSession; engine?: "demo" | "live" };
            if (event === "phase" && payload.text) setPhase(payload.text);
            if (event === "token" && payload.text) {
              streamed += payload.text;
              setStreaming(streamed);
            }
            if (event === "done" && payload.session) {
              doneSession = payload.session;
              if (payload.engine) setEngine(payload.engine);
            }
          }
        }
        const elapsed = Date.now() - started;
        if (elapsed < 420) await new Promise((resolve) => window.setTimeout(resolve, 420 - elapsed));
        if (!doneSession) {
          setError("The reply stream ended early.");
          setDraft(message);
          return;
        }
        window.sessionStorage.setItem(STORAGE_KEY, doneSession.id);
        adopt(doneSession);
        setStreaming("");
        setPhase("");
        const urgent = /\b(fraud|stolen|identity theft|account takeover)\b/i.test(message);
        const handed = doneSession.mode === "queue" || doneSession.mode === "agent";
        if (urgent || handed) {
          const detail = {
            title: urgent ? "Desk alerted" : "New human support request",
            body: urgent
              ? "Jordan Hale reported possible fraud. Lock the card."
              : "Jordan Hale asked for a specialist.",
          };
          window.dispatchEvent(new CustomEvent("lumen:ops", { detail }));
          if (window.parent !== window) window.parent.postMessage({ source: "lumen-embed", type: "ops", ...detail }, "*");
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          setStopped(true);
          setPhase("");
        } else {
          setError("The network dropped that message.");
          setDraft(message);
        }
      } finally {
        setSending(false);
        sendLock.current = false;
        abortRef.current = null;
        inputRef.current?.focus();
        const next = queueRef.current.shift();
        if (next) void send(next);
      }
  }

  useEffect(() => {
    const ask = params.get("ask");
    if (!ask || asked.current || booting || !session) return;
    asked.current = true;
    void sendRef.current(ask);
  }, [params, booting, session]);

  useEffect(() => {
    function onHost(event: MessageEvent) {
      const data = event.data as { source?: string; type?: string; text?: string; theme?: string } | null;
      if (!data || data.source !== "lumen-host") return;
      if (data.type === "prompt" && data.text) void sendRef.current(data.text);
      if (data.type === "theme" && (data.theme === "light" || data.theme === "dark" || data.theme === "system")) {
        setTheme(data.theme);
      }
    }
    function onPage(event: Event) {
      const text = (event as CustomEvent<string>).detail;
      if (typeof text === "string") void sendRef.current(text);
    }
    window.addEventListener("message", onHost);
    window.addEventListener("lumen:send", onPage);
    if (!booting && window.parent !== window) {
      window.parent.postMessage({ source: "lumen-embed", type: "ready" }, "*");
    }
    return () => {
      window.removeEventListener("message", onHost);
      window.removeEventListener("lumen:send", onPage);
    };
  }, [booting, setTheme]);

  function addFiles(list: FileList | File[]) {
    const next: Preview[] = [];
    for (const file of Array.from(list)) {
      if (files.length + next.length >= 3) {
        showToast("You can attach 3 files per message.");
        break;
      }
      if (fileCount.current >= 10) {
        showToast("This demo keeps 10 files per conversation.");
        break;
      }
      if (file.size > MAX_FILE) {
        showToast(`${file.name} is over 5 MB.`);
        continue;
      }
      if (!ACCEPT.split(",").includes(file.type)) {
        showToast("Attach a JPG, PNG, WebP, or PDF.");
        continue;
      }
      fileCount.current += 1;
      next.push({
        name: file.name,
        url: URL.createObjectURL(file),
        kind: file.type === "application/pdf" ? "file" : "image",
      });
    }
    if (next.length) setFiles((current) => [...current, ...next]);
  }

  function submit() {
    const note = files.map((file) => `Attached file: ${file.name}`).join(" ");
    const message = [draft.trim(), note].filter(Boolean).join("\n");
    if (!message || sending) return;
    if (files.length) {
      const attached = files;
      setSentFiles((current) => ({ ...current, [message]: attached }));
    }
    setFiles([]);
    void send(message);
  }

  function startVoice() {
    const speech = window as Window & {
      SpeechRecognition?: new () => SpeechRec;
      webkitSpeechRecognition?: new () => SpeechRec;
    };
    const Ctor = speech.SpeechRecognition || speech.webkitSpeechRecognition;
    if (!Ctor) {
      showToast("Voice input isn't available in this browser. Type instead.");
      return;
    }
    const rec = new Ctor();
    rec.lang = "en-US";
    rec.onresult = (event) => {
      const said = event.results?.[0]?.[0]?.transcript ?? "";
      setDraft((current) => (current ? `${current} ${said}` : said));
      setListening(false);
    };
    rec.onerror = () => {
      setListening(false);
      showToast("Voice input isn't available in this browser. Type instead.");
    };
    rec.onend = () => setListening(false);
    setListening(true);
    rec.start();
  }

  const human = Boolean(session && (session.mode === "agent" || (session.mode === "queue" && joined)));
  const waiting = session?.mode === "queue" || session?.mode === "agent";
  const shell =
    variant === "embed"
      ? "chat-widget-shell flex h-dvh w-full flex-col rounded-none shadow-none"
      : variant === "frame"
        ? "chat-widget-shell flex h-full w-full flex-col"
        : "chat-widget-shell flex h-dvh w-full flex-col rounded-none shadow-none sm:h-[min(680px,calc(100dvh-140px))] sm:w-[400px] sm:rounded-[24px]";

  return (
    <section
      id="lumen-chat-widget"
      data-testid="chat-widget"
      className={shell}
      onDragOver={(event) => {
        event.preventDefault();
        setDrop(true);
      }}
      onDragLeave={() => setDrop(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDrop(false);
        if (event.dataTransfer.files.length) addFiles(event.dataTransfer.files);
      }}
    >
      <div className="h-0.5 bg-accent" />
      <header data-testid="chat-header" className="flex h-16 items-center gap-2 border-b border-border px-3">
        <span className="relative inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
          {human ? <span className="text-[11px] font-semibold">AR</span> : <BrandMark className="size-4" />}
          <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full bg-success ring-2 ring-surface" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold leading-5 tracking-[-0.01em]">
            {human ? `${BRAND.agent} · Lumen Card` : "Lumen · Lumen Card"}
          </span>
          <span className="flex items-center gap-1 truncate text-[12px] leading-4 text-muted-foreground">
            <span className="size-1.5 rounded-full bg-success" />
            {human ? `${BRAND.agent} · human specialist` : session?.verified ? "Online 24/7 · Verified" : "Online 24/7 · Code 000000"}
          </span>
        </span>
        <span
          data-testid="engine-pill"
          className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground"
        >
          {engine === "live" ? "Live AI" : "Demo mode"}
        </span>
        <button
          type="button"
          className="inline-flex size-8 items-center justify-center rounded-full hover:bg-accent-soft"
          aria-label="Menu"
          title="Menu"
          onClick={() => setMenu((value) => !value)}
        >
          <MoreHorizontal className="size-4" strokeWidth={1.75} />
        </button>
        {variant === "embed" ? (
          <button
            type="button"
            className="inline-flex size-8 items-center justify-center rounded-full hover:bg-accent-soft"
            aria-label="Close chat"
            title="Close"
            onClick={() => window.parent.postMessage({ source: "lumen-embed", type: "close" }, "*")}
          >
            <X className="size-4" strokeWidth={1.75} />
          </button>
        ) : null}
      </header>
      {menu ? (
        <div className="flex flex-wrap gap-2 border-b border-border px-3 py-2 text-[13px]">
          <button
            type="button"
            className="inline-flex h-8 items-center gap-1 rounded-full border border-border px-2"
            onClick={() => {
              if (waiting && !window.confirm("A specialist is on this chat. Start a new conversation?")) return;
              void resetDemo();
              setMenu(false);
            }}
          >
            <SquarePen className="size-3.5" strokeWidth={1.75} /> New chat
          </button>
          <ThemeToggle />
          <button
            type="button"
            className="inline-flex h-8 items-center gap-1 rounded-full border border-border px-2"
            onClick={() => {
              setMenu(false);
              void send("I want to speak with a person.");
            }}
          >
            <Headphones className="size-3.5" strokeWidth={1.75} /> Talk to a human
          </button>
          <span className="self-center text-[11px] text-muted-foreground">{session?.verified ? "Verified" : "Code 000000"}</span>
        </div>
      ) : null}
      {waiting ? (
        <p data-testid="handoff-banner" className="border-b border-border bg-accent-soft px-3 py-2 text-[12px]">
          {human ? `${BRAND.agent} joined` : "Connecting you to a team member…"}
        </p>
      ) : null}
      <div className="relative min-h-0 flex-1">
        <div
          ref={logRef}
          data-testid="chat-messages"
          role="log"
          aria-relevant="additions"
          aria-live="off"
          className="thin-scroll h-full space-y-3 overflow-y-auto px-4 py-3"
          onScroll={(event) => {
            const node = event.currentTarget;
            const distance = node.scrollHeight - node.scrollTop - node.clientHeight;
            const next = distance < 80;
            stickRef.current = next;
            setStick(next);
          }}
        >
          {session?.messages.some((item) => item.role === "user" && /\b(fraud|stolen|identity theft|account takeover)\b/i.test(item.text)) ? (
            <p data-testid="urgent-banner" role="alert" className="rounded-[12px] border border-danger/50 bg-danger/10 px-3 py-2 text-[13px] text-danger">
              Lock the card first. Fraud is routed to the desk. This demo does not call a bank.
            </p>
          ) : null}
          {booting ? <p className="text-[13px] text-muted-foreground">Opening a secure demo chat…</p> : null}
          {!booting && session?.messages.length === 0 ? (
            <div>
              <p className="max-w-[34em] text-[14.5px] leading-[22px]">{GREETING}</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {STARTERS.map((starter) => (
                  <button
                    key={starter.label}
                    type="button"
                    data-testid="quick-reply"
                    className="flex min-h-16 items-start gap-2 rounded-[16px] border border-border bg-surface p-3 text-left text-[13px] font-medium leading-4 hover:bg-accent-soft"
                    onClick={() => void send(starter.prompt)}
                  >
                    <IconForStarter name={starter.icon} />
                    <span>{starter.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          {session?.messages.map((message, index) => {
            const previous = session.messages[index - 1];
            const same = previous?.role === message.role;
            const time = new Date(message.createdAt);
            const label =
              message.role === "user"
                ? "You"
                : message.role === "agent"
                  ? message.agentName ?? BRAND.agent
                  : message.role === "system"
                    ? "Desk"
                    : BRAND.bot;
            const cards = message.role === "assistant" ? deriveCards(message) : [];
            const showForm =
              message.role === "assistant" &&
              asksForCode(message) &&
              /dispute|recognize|charge/i.test(previous?.text ?? "");
            const long = message.text.length > 80 || cards.length > 0;
            const previews = message.role === "user" ? sentFiles[message.text] : undefined;
            return (
              <motion.article
                key={message.id}
                data-testid={message.role === "user" ? "message-user" : "message-assistant"}
                aria-label={`${label}, ${time.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                className={message.role === "user" ? "ml-auto max-w-[82%]" : "max-w-full"}
                style={{ marginTop: same ? 6 : 12 }}
              >
                {message.role !== "user" && !same ? (
                  <p className="mb-1 text-[11.5px] text-muted-foreground">{label}</p>
                ) : null}
                <div
                  className={
                    message.role === "user"
                      ? "rounded-[18px] rounded-br-[4px] bg-accent px-3 py-2 text-[14.5px] leading-[22px] text-accent-foreground"
                      : message.role === "agent"
                        ? "rounded-[18px] rounded-bl-[4px] bg-surface-2 px-3 py-2 text-[14.5px] leading-[22px]"
                        : long
                          ? "text-[14.5px] leading-[22px]"
                          : "max-w-fit rounded-[18px] bg-muted px-3 py-2 text-[14.5px] leading-[22px]"
                  }
                >
                  {message.role === "user" ? (
                    <p className="whitespace-pre-wrap">{message.text}</p>
                  ) : (
                    <MarkdownText text={message.text} />
                  )}
                </div>
                {previews?.length ? (
                  <div className="mt-1 flex gap-1">
                    {previews.map((file) =>
                      file.kind === "image" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={file.url} src={file.url} alt={file.name} className="size-12 rounded-[12px] object-cover" />
                      ) : (
                        <span key={file.url} className="rounded-[12px] border border-border px-2 py-1 text-[11px]">
                          {file.name}
                        </span>
                      ),
                    )}
                  </div>
                ) : null}
                {previews?.length && message.role === "user" ? (
                  <p className="mt-1 text-[11.5px] text-muted-foreground">
                    Got {previews.map((file) => file.name).join(", ")}. This demo doesn&apos;t inspect images.
                  </p>
                ) : null}
                <time dateTime={message.createdAt} className="sr-only">
                  {time.toISOString()}
                </time>
                {cards.length ? <RichCards cards={cards} onChoose={(text) => void send(text)} /> : null}
                {message.dispute ? (
                  <div data-testid="card-checklist" className="mt-2 rounded-[16px] border border-border bg-surface p-3">
                    <p className="text-[14px] font-semibold">Documents for this dispute</p>
                    <ul className="mt-2 space-y-1 text-[13px]">
                      <li>Merchant receipt for {message.dispute.merchant}</li>
                      <li>Posted amount ${(message.dispute.amountCents / 100).toFixed(2)}</li>
                      <li>Card ending {message.dispute.last4} only. Never a full number.</li>
                    </ul>
                  </div>
                ) : null}
                {showForm ? (
                  <div className="mt-2">
                    <DisputeReasonForm onChoose={(text) => void send(text)} />
                  </div>
                ) : null}
                {message.tools?.length && message.role === "assistant" ? <ToolRows tools={message.tools} /> : null}
                {message.citations?.length ? <CitationRow citations={message.citations} /> : null}
                {message.role === "assistant" ? (
                  <div data-testid="message-actions" className="mt-1 flex flex-wrap gap-1">
                    <CopyButton value={message.text} />
                    <button
                      type="button"
                      aria-label="Regenerate"
                      title="Regenerate"
                      className="inline-flex h-7 items-center gap-1 rounded-full px-2 text-[11.5px] hover:bg-accent-soft"
                      onClick={() => {
                        const prior = [...session.messages]
                          .slice(0, index)
                          .reverse()
                          .find((item) => item.role === "user");
                        if (prior) void send(prior.text);
                      }}
                    >
                      <RefreshCw className="size-3.5" strokeWidth={1.75} /> Regenerate
                    </button>
                    <button
                      type="button"
                      aria-label="Good reply"
                      title="Good reply"
                      aria-pressed={feedback[message.id] === "up"}
                      className="inline-flex h-7 items-center gap-1 rounded-full px-2 text-[11.5px] hover:bg-accent-soft"
                      onClick={() => setFeedback((current) => ({ ...current, [message.id]: "up" }))}
                    >
                      <ThumbsUp className="size-3.5" strokeWidth={1.75} />
                    </button>
                    <button
                      type="button"
                      aria-label="Bad reply"
                      title="Bad reply"
                      aria-pressed={feedback[message.id] === "down"}
                      className="inline-flex h-7 items-center gap-1 rounded-full px-2 text-[11.5px] hover:bg-accent-soft"
                      onClick={() => setFeedback((current) => ({ ...current, [message.id]: "down" }))}
                    >
                      <ThumbsDown className="size-3.5" strokeWidth={1.75} />
                    </button>
                    {message.citations?.length ? (
                      <span className="inline-flex h-7 items-center px-1 text-[11.5px] text-muted-foreground" title="Sources">
                        Sources
                      </span>
                    ) : null}
                  </div>
                ) : null}
                {message.role === "assistant" ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(asksForCode(message)
                      ? [{ label: "Use demo code 000000", prompt: "000000" }]
                      : followUps(message.text, Boolean(message.dispute), message.tools?.map((tool) => tool.name) ?? [])
                    ).map((chip) => (
                      <button
                        key={chip.label}
                        type="button"
                        data-testid="follow-up"
                        className="inline-flex h-9 items-center rounded-full border border-border bg-surface px-3 text-[13px] font-medium hover:bg-accent-soft"
                        onClick={() => void send(chip.prompt)}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                ) : null}
                {message.role === "assistant" && (message.tools ?? []).some((tool) => tool.name === "escalate_to_agent") ? (
                  <div data-testid="slot-chips" className="mt-2 rounded-[16px] border border-border p-3">
                    <p className="text-[14px] font-semibold">Open times · {CALLBACK_DAY}</p>
                    <p className="mt-1 text-[11.5px] text-muted-foreground">Only times the booking system returned</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {CALLBACK_SLOTS.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          data-testid="slot-chip"
                          className="inline-flex h-11 items-center rounded-[12px] border border-border px-3 text-[13px] font-medium hover:bg-accent-soft"
                          onClick={() => void send(`Book a callback for ${slot}.`)}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </motion.article>
            );
          })}
          {sending ? (
            <div data-testid="phase-indicator" aria-busy="true">
              <p className="flex items-center gap-2 text-[13px] text-muted-foreground">
                <span className="inline-flex gap-1" aria-hidden="true">
                  <span className="phase-dot size-1.5 rounded-full bg-muted-foreground" />
                  <span className="phase-dot size-1.5 rounded-full bg-muted-foreground" />
                  <span className="phase-dot size-1.5 rounded-full bg-muted-foreground" />
                </span>
                {phase || "Looking in the help center…"}
              </p>
              {streaming ? (
                <div data-streaming="true" className="mt-2 text-[14.5px] leading-[22px]">
                  <MarkdownText text={streaming} />
                  <span className="chat-caret" />
                </div>
              ) : (
                <div className="mt-2 space-y-2" aria-hidden="true">
                  <div className="shimmer h-3 w-4/5 rounded" />
                  <div className="shimmer h-3 w-2/3 rounded" />
                </div>
              )}
            </div>
          ) : null}
          {stopped ? <p className="text-[11.5px] text-muted-foreground">Stopped</p> : null}
          {error ? (
            <p role="alert" className="rounded-[12px] border border-danger/40 bg-danger/10 px-3 py-2 text-[13px] text-danger">
              {error}
              <button type="button" className="ml-2 underline" onClick={() => draft && void send(draft)}>
                Retry send
              </button>
            </p>
          ) : null}
        </div>
        {!stick && (session?.messages.length || sending) ? (
          <button
            type="button"
            data-testid="jump-to-latest"
            className="absolute bottom-2 left-1/2 inline-flex h-9 -translate-x-1/2 items-center gap-1 rounded-full border border-border bg-surface px-3 text-[12px] shadow-[var(--shadow-card)]"
            onClick={() => {
              stickRef.current = true;
              setStick(true);
              if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
            }}
          >
            <ArrowDown className="size-3.5" /> Jump to latest
          </button>
        ) : null}
      </div>
      <div className="sr-only" role="status" aria-live="polite">
        {sending ? "Assistant is replying" : session?.messages.length ? "Assistant replied" : ""}
      </div>
      {toast ? (
        <p role="alert" className="mx-3 mb-1 rounded-[12px] bg-foreground px-3 py-2 text-[12px] text-background">
          {toast}
        </p>
      ) : null}
      {drop ? (
        <p className="mx-3 mb-1 rounded-[12px] border border-dashed border-accent px-3 py-4 text-center text-[13px]">
          Drop to attach
        </p>
      ) : null}
      <form
        data-testid="composer"
        className="border-t border-border px-3 pt-2"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        {files.length ? (
          <div className="mb-2 flex gap-2">
            {files.map((file) => (
              <span key={file.url} className="relative">
                {file.kind === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={file.url} alt={file.name} className="size-12 rounded-[12px] object-cover" />
                ) : (
                  <span className="inline-flex h-12 items-center rounded-[12px] border border-border px-2 text-[11px]">{file.name}</span>
                )}
                <button
                  type="button"
                  aria-label={`Remove ${file.name}`}
                  className="absolute -right-1 -top-1 inline-flex size-5 items-center justify-center rounded-full bg-foreground text-background"
                  onClick={() => setFiles((current) => current.filter((item) => item.url !== file.url))}
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        ) : null}
        <div className="flex items-end gap-1 rounded-[16px] border border-border bg-surface-2 p-1.5 pl-2">
          <label className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full hover:bg-accent-soft">
            <Paperclip className="size-4" strokeWidth={1.75} />
            <span className="sr-only">Attach a file</span>
            <input
              data-testid="composer-attach"
              className="sr-only"
              type="file"
              accept={ACCEPT}
              multiple
              onChange={(event) => {
                if (event.target.files) addFiles(event.target.files);
                event.target.value = "";
              }}
            />
          </label>
          <label htmlFor="message" className="sr-only">
            Message
          </label>
          <textarea
            id="message"
            ref={inputRef}
            data-testid="composer-input"
            rows={1}
            value={draft}
            placeholder={listening ? "Listening…" : human ? `Message ${BRAND.agent}…` : PLACEHOLDER}
            className="thin-scroll max-h-36 min-h-16 flex-1 resize-none bg-transparent py-1.5 text-[14.5px] leading-[22px] outline-none"
            onChange={(event) => {
              setDraft(event.target.value);
              event.target.style.height = "auto";
              event.target.style.height = `${Math.min(event.target.scrollHeight, 128)}px`;
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submit();
              }
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                event.preventDefault();
                submit();
              }
            }}
          />
          <button
            type="button"
            data-testid="composer-mic"
            aria-label={listening ? "Listening" : "Start voice input"}
            className={`inline-flex size-8 items-center justify-center rounded-full hover:bg-accent-soft ${listening ? "ring-2 ring-accent" : ""}`}
            onClick={startVoice}
          >
            <Mic className="size-4" strokeWidth={1.75} />
          </button>
          {sending ? (
            <button
              type="button"
              data-testid="composer-stop"
              aria-label="Stop generating"
              className="inline-flex size-8 items-center justify-center rounded-full bg-accent text-accent-foreground"
              onClick={() => abortRef.current?.abort()}
            >
              <Square className="size-2.5 fill-current" />
            </button>
          ) : (
            <button
              type="submit"
              data-testid="composer-send"
              aria-label="Send"
              disabled={!draft.trim() && files.length === 0}
              className="inline-flex size-8 items-center justify-center rounded-full bg-accent text-accent-foreground disabled:opacity-40"
            >
              <ArrowUp className="size-4" strokeWidth={1.75} />
            </button>
          )}
        </div>
        <button
          type="button"
          className="mt-1 text-left text-[12px] text-muted-foreground underline-offset-2 hover:underline"
          onClick={() => setLeadOpen(true)}
        >
          Leave contact details for the team
        </button>
        {leadOpen ? (
          <form
            data-testid="card-lead"
            className="mt-2 space-y-2 rounded-[16px] border border-border p-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (!lead.name.trim() || !lead.phone.trim() || !lead.email.trim() || !lead.consent) {
                setError("Add a name, phone, email, and consent before sending details.");
                return;
              }
              const summary = `${lead.name} · ${lead.phone} · ${lead.email}`;
              setLead((current) => ({ ...current, saved: summary }));
              setLeadOpen(false);
              void send(`Please reach ${lead.name} at ${lead.phone} or ${lead.email}. They consented to a demo callback.`);
            }}
          >
            <p className="text-[14px] font-semibold">Leave contact details for the team</p>
            <label className="block text-[12px] font-medium">
              Name
              <input
                className="mt-1 h-10 w-full rounded-[12px] border border-border bg-surface px-2"
                placeholder="Jordan Hale"
                value={lead.name}
                onChange={(event) => setLead((current) => ({ ...current, name: event.target.value }))}
              />
            </label>
            <label className="block text-[12px] font-medium">
              Phone
              <input
                className="mt-1 h-10 w-full rounded-[12px] border border-border bg-surface px-2"
                placeholder="555-010-0140"
                value={lead.phone}
                onChange={(event) => setLead((current) => ({ ...current, phone: event.target.value }))}
              />
            </label>
            <label className="block text-[12px] font-medium">
              Email
              <input
                className="mt-1 h-10 w-full rounded-[12px] border border-border bg-surface px-2"
                placeholder="jordan.hale@example.com"
                value={lead.email}
                onChange={(event) => setLead((current) => ({ ...current, email: event.target.value }))}
              />
            </label>
            <label className="flex items-start gap-2 text-[12px]">
              <input
                type="checkbox"
                checked={lead.consent}
                onChange={(event) => setLead((current) => ({ ...current, consent: event.target.checked }))}
              />
              The desk may use these fictional details for this demo only.
            </label>
            {lead.saved ? <p className="text-[12px] text-muted-foreground">Saved for the team: {lead.saved}</p> : null}
            <button type="submit" className="inline-flex h-11 items-center rounded-[14px] bg-accent px-3 text-[13px] font-medium text-accent-foreground">
              Save for the team
            </button>
          </form>
        ) : null}
        <p className="py-2 text-[11.5px] leading-4 text-muted-foreground">
          <a href="/privacy" className="underline-offset-2 hover:underline">
            AI assistant · Portfolio demo · Privacy
          </a>
          .{" "}
          <button type="button" className="underline-offset-2 hover:underline" onClick={() => void send("I want to speak with a person.")}>
            Talk to a person
          </button>
          .
        </p>
        <PortfolioDisclaimer className="pb-2 text-[11px] leading-4 text-muted-foreground" />
      </form>
    </section>
  );
}

function followUps(text: string, hasDispute: boolean, tools: string[]) {
  if (hasDispute) {
    return [
      { label: "Case status", prompt: "What is the status of my dispute?" },
      { label: "Talk to a specialist", prompt: "I want to speak with a person." },
    ];
  }
  if (tools.includes("freeze_card")) {
    return [
      { label: "Show charges", prompt: "Show my recent transactions." },
      { label: "Unlock the card", prompt: "Unfreeze my card" },
    ];
  }
  if (tools.includes("search_kb") && /\$0|annual/i.test(text)) {
    return [
      { label: "Foreign fee", prompt: "What is the foreign transaction fee on Lumen Reserve?" },
      { label: "Lock my card", prompt: "Lock my card" },
    ];
  }
  if (tools.includes("escalate_to_agent")) {
    return [
      { label: "Lock my card", prompt: "Lock my card" },
      { label: "Leave a callback", prompt: "Book a callback for 2:30 PM." },
    ];
  }
  return [
    { label: "Show charges", prompt: "Show my recent transactions." },
    { label: "Lock my card", prompt: "Lock my card" },
  ];
}

type SpeechRec = {
  lang: string;
  start: () => void;
  onresult: ((event: { results?: { [index: number]: { [index: number]: { transcript?: string } } } }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};
