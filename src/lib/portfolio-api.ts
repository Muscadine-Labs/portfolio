import type { PortfolioDataPayload } from "@/lib/portfolio-data";
import type { User } from "@/types";
import { getHomeApiBaseUrl } from "@/lib/home-api";
import { getTenantSlug } from "@/lib/tenant";
import {
  EMPTY_ALLOCATION_NODES,
  EMPTY_ASSETS,
  EMPTY_CASH_ACCOUNTS,
  EMPTY_CONNECTED_WALLETS,
  EMPTY_INCOME_PLAN,
  EMPTY_LIABILITIES,
  EMPTY_NET_WORTH_HISTORY,
  EMPTY_PLANNING_ITEMS,
  EMPTY_SECTIONS,
  EMPTY_SPENDING_ITEMS,
  EMPTY_UI_PREFERENCES,
  EMPTY_WALLET_MAP_NODES,
} from "@/lib/portfolio-empty";

export function createEmptyPortfolioData(): PortfolioDataPayload {
  return {
    sections: structuredClone(EMPTY_SECTIONS),
    assets: structuredClone(EMPTY_ASSETS),
    cashAccounts: structuredClone(EMPTY_CASH_ACCOUNTS),
    liabilities: structuredClone(EMPTY_LIABILITIES),
    planningItems: structuredClone(EMPTY_PLANNING_ITEMS),
    spendingItems: structuredClone(EMPTY_SPENDING_ITEMS),
    allocationNodes: structuredClone(EMPTY_ALLOCATION_NODES),
    incomePlan: structuredClone(EMPTY_INCOME_PLAN),
    walletMapNodes: structuredClone(EMPTY_WALLET_MAP_NODES),
    uiPreferences: structuredClone(EMPTY_UI_PREFERENCES),
    connectedWallets: structuredClone(EMPTY_CONNECTED_WALLETS),
    netWorthHistory: structuredClone(EMPTY_NET_WORTH_HISTORY),
  };
}

export async function fetchHomeApi(
  path: string,
  tenant: string,
  init?: RequestInit
): Promise<Response | null> {
  const base = getHomeApiBaseUrl();
  if (!base) return null;
  const headers = new Headers(init?.headers);
  headers.set("x-tenant", tenant);
  return fetch(`${base}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
}

export async function getInitialPortfolioFromApi(): Promise<PortfolioDataPayload> {
  const tenant = await getTenantSlug();
  const res = await fetchHomeApi("/api/me", tenant);
  if (res?.ok) {
    const body = (await res.json()) as { portfolio?: PortfolioDataPayload };
    if (body.portfolio) return body.portfolio;
  }

  const exportRes = await fetchHomeApi("/api/export", tenant);
  if (exportRes?.ok) {
    return (await exportRes.json()) as PortfolioDataPayload;
  }

  return createEmptyPortfolioData();
}

export async function getInitialAccountFromApi(): Promise<User> {
  const tenant = await getTenantSlug();
  const res = await fetchHomeApi("/api/me", tenant);
  if (res?.ok) {
    const body = (await res.json()) as { user?: User };
    if (body.user) return { ...body.user, tenant, password: "" };
  }
  return {
    id: "0",
    tenant,
    displayName: tenant.charAt(0).toUpperCase() + tenant.slice(1),
    email: "",
    username: "",
    password: "",
  };
}
