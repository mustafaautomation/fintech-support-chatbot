import Link from "next/link";

export function SiteHeader({ dark = false }: { dark?: boolean }) {
  return (
    <header className={`flex items-center justify-between gap-4 px-4 py-3 sm:px-6 ${dark ? "text-inherit" : ""}`}>
      <Link href="/" className="font-display text-xl tracking-tight">
        Lumen
      </Link>
      <nav className="flex items-center gap-2 text-sm">
        <Link href="/chat" className="rounded-lg px-3 py-2 hover:bg-foreground/5">
          Chat
        </Link>
        <Link href="/admin" className="rounded-lg px-3 py-2 hover:bg-foreground/5">
          Agent desk
        </Link>
      </nav>
    </header>
  );
}
