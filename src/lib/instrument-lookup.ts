/**
 * Client helper — resolve display names (and optionally prices) via home API quotes lookup.
 */

export type InstrumentLookupResult = {
  prices: Record<string, number>;
  names: Record<string, string>;
};

export async function lookupInstruments(
  symbols: string[],
  opts?: { includeNames?: boolean }
): Promise<InstrumentLookupResult> {
  const unique = [
    ...new Set(symbols.map((s) => s.trim().toUpperCase()).filter(Boolean)),
  ];
  if (unique.length === 0) {
    return { prices: {}, names: {} };
  }

  const res = await fetch("/api/market/quotes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      symbols: unique,
      includeNames: opts?.includeNames !== false,
    }),
  });
  const data = (await res.json()) as {
    prices?: Record<string, number>;
    names?: Record<string, string>;
    error?: unknown;
  };
  if (!res.ok) {
    const message =
      typeof data.error === "string"
        ? data.error
        : "Instrument lookup failed";
    throw new Error(message);
  }
  return {
    prices: data.prices ?? {},
    names: data.names ?? {},
  };
}

/** Single-token ticker (no spaces) suitable for cash name / asset symbol autofill. */
export function looksLikeTickerSymbol(value: string): boolean {
  const t = value.trim();
  return t.length > 0 && t.length <= 12 && /^[A-Za-z0-9.-]+$/.test(t);
}
