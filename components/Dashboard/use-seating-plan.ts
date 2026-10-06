"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { emptySeatingEditor, seatingEditorReducer, seatingPlanKey } from "@/lib/seating/editor";
import { loadSeatingPlan, saveSeatingPlan } from "@/lib/seating/persistence";
import type { SeatingPlan } from "@/lib/seating/plan";

export function useSeatingPlan(invitationId: string) {
  const [editor, dispatch] = useReducer(seatingEditorReducer, undefined, emptySeatingEditor);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const requests = useRef(new Set<AbortController>());
  const busy = useRef(false);

  useEffect(() => {
    const pending = requests.current;
    const controller = new AbortController();
    pending.add(controller);
    loadSeatingPlan(invitationId, controller.signal).then(({ plan, revision }) => {
      if (!controller.signal.aborted) { dispatch({ type: "LOAD", plan, revision }); setReady(true); }
    }).catch((error) => {
      if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Denah belum dapat dimuat. Coba lagi.");
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); pending.delete(controller); });
    return () => { pending.forEach((request) => request.abort()); pending.clear(); };
  }, [invitationId]);

  async function reload() {
    if (busy.current || loading || saving) return;
    busy.current = true; setLoading(true); setError("");
    const controller = new AbortController(); requests.current.add(controller);
    try {
      const { plan, revision } = await loadSeatingPlan(invitationId, controller.signal);
      if (!controller.signal.aborted) {
        const currentKey = seatingPlanKey(editor.plan);
        const replacedDraft = currentKey !== editor.savedKey && currentKey !== seatingPlanKey(plan);
        dispatch({ type: "LOAD", plan, revision, keepUndo: true }); setReady(true);
        return { replacedDraft };
      }
    } catch (error) {
      if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Denah belum dapat dimuat. Coba lagi.");
    } finally {
      requests.current.delete(controller); busy.current = false;
      if (!controller.signal.aborted) setLoading(false);
    }
  }

  async function save(plan: SeatingPlan) {
    if (busy.current || loading || saving || !ready) return false;
    busy.current = true; setSaving(true); setError("");
    const controller = new AbortController(); requests.current.add(controller);
    try {
      const result = await saveSeatingPlan(invitationId, plan, editor.revision, controller.signal);
      if (controller.signal.aborted) return false;
      dispatch({ type: "SAVED", plan: result.plan, revision: result.revision, snapshotKey: seatingPlanKey(editor.plan) });
      return true;
    } catch (error) {
      if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Denah belum tersimpan. Coba lagi.");
      return false;
    } finally {
      requests.current.delete(controller); busy.current = false;
      if (!controller.signal.aborted) setSaving(false);
    }
  }

  return { editor, dispatch, loading, saving, ready, error, reload, save };
}
