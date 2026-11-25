import { DISCLAIMER } from "@/lib/brand";

export function PortfolioDisclaimer({ className = "" }: { className?: string }) {
  return <p className={className}>{DISCLAIMER}</p>;
}
