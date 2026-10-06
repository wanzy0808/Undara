"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { isEditableTemplateStatus } from "@/lib/templates/template-editing";

type ReviewTemplate = {
  id: string;
  templateNo: string;
  name: string;
  previewUrl: string;
  category: string;
  description: string;
  status: string;
  designKey?: string | null;
  updatedAt: string;
  isCustom?: boolean;
  designer: {
    id: string;
    firstName: string;
    lastName: string | null;
    email: string;
  };
  customInvitation?: {
    id: string;
    title: string;
    eventCategory: string;
    updatedAt: string;
    owner: {
      id: string;
      email: string;
      firstName: string;
      lastName: string | null;
    };
  } | null;
};

type AssignmentInvitation = {
  id: string;
  title: string;
  eventCategory: string;
  groomName: string;
  brideName: string;
  templateKey: string;
  eventConfigured: boolean;
  updatedAt: string;
};

type AssignmentUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
  invitations: AssignmentInvitation[];
};

type AssignmentAuthor = {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
  role: string;
};

function personName(user: Pick<AssignmentUser, "firstName" | "lastName" | "email">) {
  return [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || user.email;
}

function eventName(invitation: AssignmentInvitation) {
  const couple = [invitation.groomName, invitation.brideName].filter(Boolean).join(" & ");
  return invitation.title?.trim() || couple || "Event draft";
}

function statusLabel(status: string) {
  if (status === "REVIEW") return "Menunggu Owner";
  if (status === "DRAFT") return "Draft";
  if (status === "PUBLISHED") return "Published";
  return status;
}

export default function OwnerTemplateReview() {
  const [templates, setTemplates] = useState<ReviewTemplate[]>([]);
  const [users, setUsers] = useState<AssignmentUser[]>([]);
  const [authors, setAuthors] = useState<AssignmentAuthor[]>([]);
  const [message, setMessage] = useState("Memuat template...");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [targetUserId, setTargetUserId] = useState("");
  const [targetInvitationId, setTargetInvitationId] = useState("");
  const [requestUserId, setRequestUserId] = useState("");
  const [requestInvitationId, setRequestInvitationId] = useState("");
  const [requestAuthorId, setRequestAuthorId] = useState("");
  const [creatingRequest, setCreatingRequest] = useState(false);

  async function load() {
    const [templateResponse, userResponse] = await Promise.all([
      fetch("/api/designer/templates?scope=review", { cache: "no-store" }),
      fetch("/api/owner/custom-templates", { cache: "no-store" }),
    ]);
    const [templateData, userData] = await Promise.all([
      templateResponse.json(),
      userResponse.json(),
    ]);

    if (!templateResponse.ok) {
      setMessage(templateData.error || "Template belum dapat dimuat.");
      return;
    }

    setTemplates(Array.isArray(templateData.templates) ? templateData.templates : []);
    const nextUsers = userResponse.ok && Array.isArray(userData.users) ? userData.users : [];
    const nextAuthors = userResponse.ok && Array.isArray(userData.authors) ? userData.authors : [];
    setUsers(nextUsers);
    setAuthors(nextAuthors);
    setRequestAuthorId((current) => current || nextAuthors[0]?.id || "");
    setMessage(userResponse.ok ? "" : (userData.error || "Daftar user belum dapat dimuat."));
  }

  useEffect(() => { void load(); }, []);

  async function transition(id: string, action: "PUBLISH" | "RETURN_DRAFT" | "SUBMIT_REVIEW") {
    if (busyId) return;
    setBusyId(id);
    setMessage("");
    try {
      const response = await fetch("/api/designer/templates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Status template belum dapat diubah.");
      await load();
      setMessage(
        action === "PUBLISH"
          ? "Template dipublikasikan dan sekarang dapat masuk katalog."
          : action === "SUBMIT_REVIEW"
            ? "Draft masuk tahap review dan siap dikonfirmasi ke user."
            : "Template dikembalikan ke Designer sebagai Draft.",
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Status template belum dapat diubah.");
    } finally {
      setBusyId(null);
    }
  }

  const requestUser = useMemo(
    () => users.find((user) => user.id === requestUserId) ?? null,
    [requestUserId, users],
  );

  async function createCustomRequest() {
    if (creatingRequest || !requestUserId || !requestInvitationId || !requestAuthorId) return;
    setCreatingRequest(true);
    setMessage("");
    try {
      const response = await fetch("/api/owner/custom-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_REQUEST",
          userId: requestUserId,
          invitationId: requestInvitationId,
          authorId: requestAuthorId,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Custom request belum dapat dibuat.");
      setRequestUserId("");
      setRequestInvitationId("");
      await load();
      setMessage(data.message || "Custom request dibuat.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Custom request belum dapat dibuat.");
    } finally {
      setCreatingRequest(false);
    }
  }

  function openAssignment(templateId: string) {
    setAssigningId((current) => current === templateId ? null : templateId);
    setTargetUserId("");
    setTargetInvitationId("");
    setMessage("");
  }

  const targetUser = useMemo(
    () => users.find((user) => user.id === targetUserId) ?? null,
    [targetUserId, users],
  );

  async function assignToUser(templateId: string, userId = targetUserId, invitationId = targetInvitationId) {
    if (busyId || !userId || !invitationId) return;
    setBusyId(templateId);
    setMessage("");
    try {
      const response = await fetch("/api/owner/custom-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId, userId, invitationId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Template custom belum dapat diberikan ke user.");

      setAssigningId(null);
      setTargetUserId("");
      setTargetInvitationId("");
      await load();
      setMessage(data.message || "Template custom sudah menjadi desain draft milik user.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Template custom belum dapat diberikan ke user.");
    } finally {
      setBusyId(null);
    }
  }

  const ownerAuthor = authors.find((author) => author.role === "OWNER") ?? null;

  return (
    <section className="rounded-2xl border border-primary/35 bg-background p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-[family-name:var(--font-undara-heading)] text-xl text-primary">Template Studio</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Custom request ditautkan ke event user sejak awal. Owner/Designer hanya mendapat akses ke foto event yang sedang ditugaskan.
          </p>
        </div>
        <span className="font-[family-name:var(--font-undara-mono)] text-xs text-muted-foreground">{templates.length} template</span>
      </div>

      {message && <p className="mt-4 rounded-xl bg-primary/10 p-3 text-sm text-muted-foreground" role="status">{message}</p>}

      <div className="mt-5 rounded-xl border border-primary/25 bg-primary/5 p-4">
        <h3 className="font-[family-name:var(--font-undara-heading)] text-lg">Buat Custom Request</h3>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Event user harus sudah lengkap dan punya template awal. Foto tetap milik event user; Designer hanya dapat memakai, crop, dan mengatur posisinya selama job aktif.
        </p>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          <label className="grid gap-1.5 text-xs font-medium">
            User
            <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={requestUserId}
              onChange={(event) => { setRequestUserId(event.target.value); setRequestInvitationId(""); }}>
              <option value="">Pilih user</option>
              {users.map((user) => <option key={user.id} value={user.id}>{personName(user)} · {user.email}</option>)}
            </select>
          </label>
          <label className="grid gap-1.5 text-xs font-medium">
            Event
            <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50"
              value={requestInvitationId} disabled={!requestUser} onChange={(event) => setRequestInvitationId(event.target.value)}>
              <option value="">{requestUser ? "Pilih event draft" : "Pilih user dulu"}</option>
              {requestUser?.invitations.map((invitation) => (
                <option key={invitation.id} value={invitation.id}>
                  {eventName(invitation)}{!invitation.eventConfigured ? " · belum lengkap" : !invitation.templateKey ? " · belum pilih template" : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-xs font-medium">
            Dikerjakan oleh
            <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={requestAuthorId} onChange={(event) => setRequestAuthorId(event.target.value)}>
              <option value="">Pilih Owner/Designer</option>
              {authors.map((author) => (
                <option key={author.id} value={author.id}>
                  {author.role === "OWNER" ? "Owner · " : "Designer · "}{personName(author)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <Button type="button" size="sm" className="mt-4"
          disabled={creatingRequest || !requestUserId || !requestInvitationId || !requestAuthorId}
          onClick={() => void createCustomRequest()}>
          {creatingRequest ? "Membuat..." : "Buat & Beri Akses Custom"}
        </Button>
      </div>

      {!templates.length && !message ? (
        <p className="mt-5 text-sm text-muted-foreground">Belum ada template tersimpan.</p>
      ) : (
        <div className="mt-5 divide-y divide-border">
          {templates.map((item) => {
            const designerName = [item.designer.firstName, item.designer.lastName].filter(Boolean).join(" ");
            const assigning = assigningId === item.id;
            const boundCustom = item.isCustom && item.customInvitation ? item.customInvitation : null;
            const canBoundHandoff = Boolean(boundCustom && (
              item.status === "REVIEW" || (item.status === "DRAFT" && ownerAuthor?.id === item.designer.id)
            ));

            return (
              <article key={item.id} className="grid gap-4 py-5 first:pt-0 sm:grid-cols-[120px_minmax(0,1fr)]">
                <img src={item.previewUrl} alt={item.name} className="aspect-[4/3] w-full rounded-xl border border-border object-cover" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-[family-name:var(--font-undara-mono)] text-xs text-primary">#{item.templateNo}</span>
                    <span className="rounded-md border border-primary/30 px-2 py-1 text-[10px] font-semibold text-primary">{statusLabel(item.status)}</span>
                    {item.isCustom && <span className="rounded-md border border-primary/30 px-2 py-1 text-[10px] font-semibold text-primary">Custom User</span>}
                  </div>
                  <h3 className="mt-2 font-[family-name:var(--font-undara-heading)] text-lg">{item.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{designerName || item.designer.email} · {item.category}</p>
                  {boundCustom && <p className="mt-2 text-sm text-primary">Untuk {personName(boundCustom.owner)} · {boundCustom.title}</p>}
                  {item.description && <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>}

                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.designKey && isEditableTemplateStatus(item.status) && (
                      <Button asChild size="sm" variant="outline"><Link href={`/owner/studio?draft=${encodeURIComponent(item.id)}`}>Lanjut edit</Link></Button>
                    )}
                    {item.status === "DRAFT" && (
                      <Button type="button" size="sm" disabled={busyId === item.id} onClick={() => void transition(item.id, "SUBMIT_REVIEW")}>
                        {busyId === item.id ? "Memproses..." : "Kirim Review"}
                      </Button>
                    )}
                    {item.status === "REVIEW" && !item.isCustom && (
                      <>
                        <Button type="button" size="sm" disabled={busyId === item.id} onClick={() => void transition(item.id, "PUBLISH")}>
                          {busyId === item.id ? "Memproses..." : "Publish ke Katalog"}
                        </Button>
                        <Button type="button" size="sm" variant="outline" disabled={busyId === item.id} onClick={() => void transition(item.id, "RETURN_DRAFT")}>Kembalikan Draft</Button>
                      </>
                    )}
                    {item.status === "REVIEW" && item.isCustom && (
                      <Button type="button" size="sm" variant="outline" disabled={busyId === item.id} onClick={() => void transition(item.id, "RETURN_DRAFT")}>Minta Revisi</Button>
                    )}
                    {boundCustom ? (
                      canBoundHandoff ? (
                        <Button type="button" size="sm" disabled={busyId === item.id}
                          onClick={() => void assignToUser(item.id, boundCustom.owner.id, boundCustom.id)}>
                          {busyId === item.id ? "Memberikan..." : "Konfirmasi ke User"}
                        </Button>
                      ) : <span className="self-center text-xs text-muted-foreground">Menunggu Designer mengirim ke review.</span>
                    ) : (
                      <Button type="button" size="sm" variant={assigning ? "default" : "outline"} disabled={busyId === item.id}
                        onClick={() => openAssignment(item.id)}>
                        {assigning ? "Tutup Pilihan User" : "Berikan ke User"}
                      </Button>
                    )}
                  </div>

                  {assigning && !boundCustom && (
                    <div className="mt-4 rounded-xl border border-primary/25 bg-primary/5 p-4">
                      <p className="text-sm font-semibold">Assign template custom lama</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">Jalur ini dipertahankan untuk draft lama yang belum ditautkan sejak awal.</p>
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <label className="grid gap-1.5 text-xs font-medium">User yang request
                          <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={targetUserId}
                            onChange={(event) => { setTargetUserId(event.target.value); setTargetInvitationId(""); }}>
                            <option value="">Pilih user</option>
                            {users.map((user) => <option key={user.id} value={user.id}>{personName(user)} · {user.email}</option>)}
                          </select>
                        </label>
                        <label className="grid gap-1.5 text-xs font-medium">Event tujuan
                          <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50"
                            value={targetInvitationId} disabled={!targetUser} onChange={(event) => setTargetInvitationId(event.target.value)}>
                            <option value="">{targetUser ? "Pilih event draft" : "Pilih user dulu"}</option>
                            {targetUser?.invitations.map((invitation) => <option key={invitation.id} value={invitation.id}>{eventName(invitation)}</option>)}
                          </select>
                        </label>
                      </div>
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <Button type="button" size="sm" disabled={busyId === item.id || !targetUserId || !targetInvitationId}
                          onClick={() => void assignToUser(item.id)}>
                          {busyId === item.id ? "Memberikan..." : "Konfirmasi ke User"}
                        </Button>
                        <span className="text-xs text-muted-foreground">Template custom tidak dipublish ke katalog.</span>
                      </div>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
