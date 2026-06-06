import type { SectionMetadata } from "@/types";

export function parseSectionMetadata(raw: unknown): SectionMetadata | undefined {
  if (!isRecord(raw)) return undefined;

  const metadata: SectionMetadata = {};
  if (raw.isDefi === true) metadata.isDefi = true;
  if (raw.isCrypto === true) metadata.isCrypto = true;
  if (raw.showNetworkColumn === false) metadata.showNetworkColumn = false;
  if (raw.showNetworkColumn === true) metadata.showNetworkColumn = true;
  if (raw.showProtocolColumn === false) metadata.showProtocolColumn = false;
  if (raw.showProtocolColumn === true) metadata.showProtocolColumn = true;
  if (typeof raw.walletId === "string" && raw.walletId.trim()) {
    metadata.walletId = raw.walletId.trim();
  }
  if (typeof raw.account === "string" && raw.account.trim()) {
    metadata.account = raw.account.trim();
  }
  if (typeof raw.overviewGroup === "string" && raw.overviewGroup.trim()) {
    metadata.overviewGroup = raw.overviewGroup.trim();
  }

  return Object.keys(metadata).length > 0 ? metadata : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
