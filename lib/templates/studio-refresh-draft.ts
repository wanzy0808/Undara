/** A temporary edit-session snapshot. It is never sent to the server or shared across tabs. */
export const STUDIO_REFRESH_DRAFT_KEY = "dc-organizer:studio:refresh-draft:v1";
const MAX_DRAFT_LENGTH = 120_000;

/** Template drafts have their own edit session, including custom drafts for one event. */
export function templateStudioEntryId(draftId?: string | null): string {
  return draftId ? `template-studio-draft:${draftId}` : "template-studio-draft";
}

export type StudioRefreshDraft = {
  version: 1;
  invitationId: string;
  /** Server-saved state at the moment of editing: reject stale or cross-event snapshots. */
  baseline: string;
  /** JSON array: [design key, music URL, event tag, dress code]. */
  state: string;
};

export function makeStudioRefreshDraft(
  invitationId: string, baseline: string, state: string,
): StudioRefreshDraft {
  return { version: 1, invitationId, baseline, state };
}

export function recoverStudioRefreshDraft(
  raw: string | null,
  navigationType: string,
  invitationId: string,
  serverBaseline: string,
): [string, string, string, string] | null {
  // Opening Studio again after leaving it (including browser Back/Forward) starts from saved data.
  if (navigationType !== "reload" || !raw || raw.length > MAX_DRAFT_LENGTH) return null;
  try {
    const draft: unknown = JSON.parse(raw);
    if (!draft || typeof draft !== "object" || Array.isArray(draft)) return null;
    const entry = draft as Partial<StudioRefreshDraft>;
    if (entry.version !== 1 || entry.invitationId !== invitationId ||
      entry.baseline !== serverBaseline || typeof entry.state !== "string") return null;
    const state: unknown = JSON.parse(entry.state);
    if (!Array.isArray(state) || state.length !== 4 ||
      state.some((value) => typeof value !== "string")) return null;
    // Don't resurrect an already-saved (or empty) draft.
    if (entry.state === serverBaseline) return null;
    return state as [string, string, string, string];
  } catch {
    return null;
  }
}
