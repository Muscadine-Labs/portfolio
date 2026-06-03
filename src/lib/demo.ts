import { cookies, headers } from "next/headers";
import { DEMO_COOKIE } from "@/lib/demo-constants";

export { DEMO_COOKIE, DEMO_TENANT } from "@/lib/demo-constants";
export { isDemoTenant } from "@/lib/demo-constants";

export function isDemoCookieValue(value: string | undefined | null): boolean {
  return value === "1";
}

export async function isDemoSessionFromHeaders(): Promise<boolean> {
  const headersList = await headers();
  const cookieHeader = headersList.get("cookie") ?? "";
  return /(?:^|;\s*)portfolio_demo=1(?:;|$)/.test(cookieHeader);
}

export async function isDemoSessionFromCookies(): Promise<boolean> {
  const store = await cookies();
  return isDemoCookieValue(store.get(DEMO_COOKIE)?.value);
}

export function demoCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  };
}

export function clearDemoCookieHeader(): string {
  return `${DEMO_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
