/** Turn unknown thrown values into a readable message for UI and toasts. */
export function formatAppError(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  if (typeof error === "string" && error.trim()) {
    return error;
  }
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    if (typeof record.message === "string" && record.message.trim()) {
      return record.message;
    }
    if (typeof record.error === "string" && record.error.trim()) {
      return record.error;
    }
    if (typeof record.error === "object" && record.error !== null) {
      return formatAppError(record.error);
    }
    try {
      return JSON.stringify(error);
    } catch {
      /* fall through */
    }
  }
  return "An unexpected error occurred.";
}

/** Parse a fetch Response as JSON; surfaces HTML/error pages as readable errors. */
export async function readJsonResponse<T = unknown>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text.trim()) {
    throw new Error(`Empty response from server (${res.status})`);
  }
  if (text.trimStart().startsWith("<")) {
    throw new Error(`Server returned HTML instead of JSON (${res.status})`);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Invalid JSON from server (${res.status})`);
  }
}

/** API / toast helper — never surfaces `[object Object]`. */
export function apiErrorMessage(error: unknown, fallback: string): string {
  if (error === undefined || error === null) return fallback;
  if (typeof error === "string") return error.trim() || fallback;
  const msg = formatAppError(error);
  return msg === "An unexpected error occurred." ? fallback : msg;
}
