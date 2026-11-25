export function LumenCard({
  last4 = "4419",
  status = "active",
  compact = false,
}: {
  last4?: string;
  status?: string;
  compact?: boolean;
}) {
  const frozen = status !== "active";
  return (
    <div
      className={`relative overflow-hidden rounded-[16px] bg-accent text-accent-foreground shadow-[var(--shadow-card)] ${compact ? "h-36 w-full max-w-xs p-4" : "h-48 w-full max-w-sm p-5"}`}
    >
      <div className="flex items-start justify-between">
        <p className="text-xl font-medium tracking-tight">Lumen</p>
        <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.16em]">
          {frozen ? status : "Reserve"}
        </span>
      </div>
      <div
        className="mt-6 h-8 w-11 rounded-md"
        style={{ background: "linear-gradient(to bottom right, var(--gold-soft), var(--gold))" }}
      />
      <div className="mt-6 flex items-end justify-between">
        <p className="font-mono-nums text-sm tracking-[0.28em]">···· {last4}</p>
        <p className="text-[10px] uppercase tracking-[0.18em] text-white/70">Visa · demo</p>
      </div>
    </div>
  );
}
