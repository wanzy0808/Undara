import { emptySeatingPlan, parseSeatingPlan, type SeatingPlan } from "./plan";

type Fetcher = typeof fetch;
async function seatingResponse(url: string, options: RequestInit, failure: string, fetcher: Fetcher) {
  try {
    const response = await fetcher(url, options);
    return { response, data: await response.json().catch(() => null) };
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new Error(failure);
  }
}

export async function loadSeatingPlan(invitationId: string, signal?: AbortSignal, fetcher: Fetcher = fetch) {
  const { response, data } = await seatingResponse(`/api/seating-plan?invitationId=${encodeURIComponent(invitationId)}`, { cache: "no-store", signal }, "Denah belum dapat dimuat. Coba lagi.", fetcher);
  if (!response.ok) throw new Error(data?.error || "Denah belum dapat dimuat. Coba lagi.");
  const plan = data?.layout === null ? emptySeatingPlan() : parseSeatingPlan(data?.layout);
  if (!plan || !(data.updatedAt === null || typeof data.updatedAt === "string")) throw new Error("Data denah tidak valid.");
  return { plan, revision: data.updatedAt as string | null };
}

export async function saveSeatingPlan(invitationId: string, plan: SeatingPlan, revision: string | null, signal?: AbortSignal, fetcher: Fetcher = fetch) {
  const { response, data } = await seatingResponse("/api/seating-plan", {
    method: "PUT", headers: { "Content-Type": "application/json" }, signal,
    body: JSON.stringify({ invitationId, layout: plan, updatedAt: revision }),
  }, "Denah belum tersimpan. Coba lagi.", fetcher);
  if (!response.ok) throw new Error(data?.error || "Denah belum tersimpan. Coba lagi.");
  const savedPlan = parseSeatingPlan(data?.layout);
  if (!savedPlan || typeof data.updatedAt !== "string") throw new Error("Data denah tidak valid.");
  return { plan: savedPlan, revision: data.updatedAt };
}

export async function clearSeatingPlan(invitationId: string, tableIds: string[], revision: string | null, signal?: AbortSignal, fetcher: Fetcher = fetch) {
  const { response, data } = await seatingResponse("/api/seating-plan", {
    method: "DELETE", headers: { "Content-Type": "application/json" }, signal,
    body: JSON.stringify({ invitationId, tableIds, updatedAt: revision }),
  }, "Denah belum dapat dikosongkan. Coba lagi.", fetcher);
  if (!response.ok) throw new Error(data?.error || "Denah belum dapat dikosongkan. Coba lagi.");
  const plan = parseSeatingPlan(data?.layout);
  if (!plan || Object.keys(plan.tables).length || plan.paths.length || typeof data.updatedAt !== "string") throw new Error("Data denah tidak valid.");
  return { plan, revision: data.updatedAt };
}
