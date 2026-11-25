export const SEEDED_PAN = "4539781200344419";

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
const CARD_RUN = /(?<!\d)(?:\d[ \t-]*){12,}\d(?!\d)/g;

function cardRuns(value: string) {
  const withoutIds = value.replace(UUID, " ");
  return withoutIds.match(new RegExp(CARD_RUN.source, "g")) ?? [];
}

function isCardNumber(match: string) {
  const digits = match.replace(/\D/g, "");
  return digits.length >= 13 && digits.length <= 19;
}

export function maskSensitive(input: string) {
  const ids: string[] = [];
  const parked = input.replace(UUID, (id) => {
    ids.push(id);
    return `__ID${ids.length - 1}__`;
  });
  const masked = parked.replace(new RegExp(CARD_RUN.source, "g"), (match) => {
    if (!isCardNumber(match)) return match;
    return `···· ${match.replace(/\D/g, "").slice(-4)}`;
  });
  return masked.replace(/__ID(\d+)__/g, (_, index: string) => ids[Number(index)] ?? "");
}

export function containsPan(value: string) {
  if (value.replace(UUID, "").includes(SEEDED_PAN)) return true;
  return cardRuns(value).some(isCardNumber);
}

export function assertNoPan(value: unknown) {
  const raw = typeof value === "string" ? value : JSON.stringify(value);
  if (containsPan(raw)) {
    throw new Error("Refusing to send a full card number");
  }
}
