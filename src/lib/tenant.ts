import { headers } from "next/headers";
import {
  getInitialAccountFromApi,
  getInitialPortfolioFromApi,
} from "@/lib/portfolio-api";
import { getTenantCredentials } from "@/lib/account-credentials-store";
import { getHomeApiBaseUrl } from "@/lib/home-api";
import { isAuthRequiredForTenant } from "@/lib/auth";
import type { User } from "@/types";
import type { PortfolioDataPayload } from "@/lib/portfolio-data";

export async function getTenantSlug(): Promise<string> {
  const headersList = await headers();
  return headersList.get("x-tenant") ?? process.env.DEV_TENANT ?? "workspace";
}

export async function getTenantUser(): Promise<User> {
  return getInitialAccount();
}

/** Account form seeds; credentials sync to home API on save. */
export async function getInitialAccount(): Promise<User> {
  if (getHomeApiBaseUrl()) {
    return getInitialAccountFromApi();
  }
  const tenant = await getTenantSlug();
  const envUsername = process.env.PORTFOLIO_USERNAME?.trim();
  const storedUsername = getTenantCredentials(tenant)?.username?.trim();
  return {
    id: "0",
    tenant,
    displayName: tenant.charAt(0).toUpperCase() + tenant.slice(1),
    email: "",
    username: storedUsername ?? envUsername ?? "",
    password: "",
  };
}

export async function getInitialPortfolio(): Promise<PortfolioDataPayload> {
  if (getHomeApiBaseUrl()) {
    return getInitialPortfolioFromApi();
  }
  const { createEmptyPortfolioData } = await import("@/lib/portfolio-api");
  return createEmptyPortfolioData();
}

export async function isTenantAuthRequired(): Promise<boolean> {
  const tenant = await getTenantSlug();
  return isAuthRequiredForTenant(tenant);
}
