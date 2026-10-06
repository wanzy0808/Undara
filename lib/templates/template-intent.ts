import { invitationTemplates } from "@/lib/templates/catalog";

/**
 * A temporary, non-sensitive template choice during catalog -> login -> event -> Studio.
 * The actual invitation design is saved only by Studio's authenticated Save Design API.
 */
const STORAGE_KEY = "dc-organizer:pending-invitation-template";
export const PENDING_TEMPLATE_COOKIE = "dc_pending_invitation_template";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function isSelectableTemplate(key: string | null | undefined): key is string {
  return Boolean(key && (invitationTemplates.some((template) => template.key === key) || /^designer:\d{3,}$/.test(key)));
}

export function rememberTemplateSelection(key: string) {
  if (!isSelectableTemplate(key) || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      key,
      expiresAt: Date.now() + MAX_AGE_MS,
    }));
  } catch {
    // URLs and cookie still carry the choice when localStorage is unavailable.
  }
  try {
    // Only the non-sensitive theme slug, never event/customer/auth data.
    window.document.cookie = `${PENDING_TEMPLATE_COOKIE}=${encodeURIComponent(key)}; Path=/; Max-Age=604800; SameSite=Lax${window.location.protocol === "https:" ? "; Secure" : ""}`;
  } catch {
    // Explicit ?template= link continues to work with cookies disabled.
  }
}

export function readTemplateSelection(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const item: unknown = JSON.parse(stored);
      if (typeof item === "object" && item && "key" in item && "expiresAt" in item) {
        const { key, expiresAt } = item as { key: unknown; expiresAt: unknown };
        if (typeof key === "string" && isSelectableTemplate(key) &&
            typeof expiresAt === "number" && Number.isFinite(expiresAt) &&
            expiresAt > Date.now()) {
          return key;
        }
      }
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Blocked, corrupt or unavailable storage must not prevent the cookie fallback.
  }
  try {
    const cookie = window.document.cookie.split("; ").find((item) => item.startsWith(`${PENDING_TEMPLATE_COOKIE}=`));
    const key = cookie ? decodeURIComponent(cookie.slice(PENDING_TEMPLATE_COOKIE.length + 1)) : null;
    return isSelectableTemplate(key) ? key : null;
  } catch {
    return null;
  }
}

export function clearTemplateSelection(key?: string) {
  if (typeof window === "undefined") return;
  if (key !== undefined && readTemplateSelection() !== key) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Saving an invitation is never blocked by the optional browser cache.
  }
  try {
    window.document.cookie = `${PENDING_TEMPLATE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${window.location.protocol === "https:" ? "; Secure" : ""}`;
  } catch {
    // No need to block a successful save if cookie access is unavailable.
  }
}
