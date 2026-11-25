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
      className={`relative overflow-hidden rounded-2xl bg-[#16352b] text-[#f6f1e4] shadow-[0_18px_40px_-24px_rgba(20,40,32,0.7)] ${compact ? "h-36 w-full max-w-xs p-4" : "h-48 w-full max-w-sm p-5"}`}
    >
      <div className="absolute -right-8 -top-10 h-36 w-36 rounded-full bg-lumen/30 blur-2xl" />
      <div className="flex items-start justify-between">
        <p className="font-display text-xl tracking-tight">Lumen</p>
        <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.16em]">
          {frozen ? status : "Reserve"}
        </span>
      </div>
      <div className="mt-6 h-8 w-11 rounded-md bg-gradient-to-br from-[#f0d7a2] to-[#b8883e]" />
      <div className="mt-6 flex items-end justify-between">
        <p className="text-sm tracking-[0.28em]">···· {last4}</p>
        <p className="text-[10px] uppercase tracking-[0.18em] text-white/70">Visa · demo</p>
      </div>
    </div>
  );
}
