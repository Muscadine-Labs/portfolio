import type { WalletType } from "@/types";

export const WALLET_TYPE_OPTIONS: { value: WalletType; label: string }[] = [
  { value: "family_master", label: "Family master key" },
  { value: "person_master", label: "Person master key" },
  { value: "bitcoin_cold", label: "Bitcoin cold" },
  { value: "crypto_cold", label: "Crypto cold" },
  { value: "defi_cold", label: "DeFi cold" },
  { value: "defi_onchain", label: "DeFi on-chain" },
  { value: "hot", label: "Hot wallet" },
  { value: "dev", label: "Dev / testing" },
  { value: "other", label: "Other" },
];

export function walletTypeLabel(type?: WalletType): string | null {
  if (!type) return null;
  return WALLET_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}
