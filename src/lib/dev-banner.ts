export const DEV_BANNER_STORAGE_KEY = "portfolio-dev-warning-dismissed";

export function clearDevBannerDismissed(): void {
  try {
    sessionStorage.removeItem(DEV_BANNER_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
