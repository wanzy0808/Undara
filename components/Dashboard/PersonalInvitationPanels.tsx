"use client";

import { WeddingGuestScopeField } from "./WeddingSessionFields";
import { weddingSessionsFor, weddingSessionLabel, type WeddingSessionId } from "@/lib/events/wedding-sessions";

import { FloatingField } from "@/components/ui/floating-field";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ContactRound,
  Copy,
  Eye,
  KeyRound,
  PenLine,
  Plus,
  RefreshCw,
  Send,
  Settings2,
  ShieldOff,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useDashboardI18n } from "@/components/Dashboard/useDashboardI18n";
import { displayTitleCase } from "@/lib/text/display-title-case";
import { buildPersonalGuestAddressee, formatPersonalEnvelopeAddress, type PersonalSalutation } from "@/lib/guests/personal-envelope";
import { MAX_GUEST_PARTY_SIZE, minimumInvitedPaxForSalutation } from "@/lib/guests/manual-party";
import {
  DashboardEmptyState,
  DashboardPanel,
  DashboardStatusBadge,
} from "@/components/Dashboard/DashboardPrimitives";
import {
  PersonalInvitationGuestFields,
  PersonalInvitationSalutationField,
  emptyGuestInvitationForm,
  type GuestInvitationForm,
} from "@/components/Dashboard/PersonalInvitationGuestFields";
import { buildPersonalInvitationPublicUrl, buildPersonalInvitationWhatsAppUrl, splitPersonalGuestNames } from "@/components/Dashboard/personal-invitation-helpers";
import type {
  PersonalInvitationEvent,
  PersonalInvitationDraft,
  PersonalInvitationGuest,
  PersonalInvitationItem,
} from "@/components/Dashboard/personal-invitation-types";

export function PersonalInvitationCreatePanel({
  selectedEvent,
  availableGuests,
  guestId,
  setGuestId,
  name,
  setName,
  salutation,
  setSalutation,
  profile,
  setProfile,
  loading,
  busyId,
  drafts,
  onAddExisting,
  onAddNames,
  onRemoveDraft,
  onEditDraft,
}: {
  selectedEvent: PersonalInvitationEvent | null;
  availableGuests: PersonalInvitationGuest[];
  guestId: string;
  setGuestId: (value: string) => void;
  name: string;
  setName: (value: string) => void;
  salutation: PersonalSalutation;
  setSalutation: (value: PersonalSalutation) => void;
  profile: GuestInvitationForm;
  setProfile: (next: GuestInvitationForm) => void;
  loading: boolean;
  busyId: string | null;
  drafts: PersonalInvitationDraft[];
  onAddExisting: () => void;
  onAddNames: () => void;
  onRemoveDraft: (key: string) => void;
  onEditDraft: (
    key: string,
    value: { name?: string; category?: string; salutation?: PersonalSalutation; invitedPax?: number; invitedSessions?: WeddingSessionId[] },
  ) => void;
}) {
  const { d, locale } = useDashboardI18n();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(40);
  const [draftLimit, setDraftLimit] = useState(40);
  const nameInputRef = useRef<HTMLTextAreaElement>(null);
  const selectedGuest = availableGuests.find((guest) => guest.id === guestId);
  const matches = availableGuests.filter((guest) =>
    `${guest.name} ${guest.phone ?? ""}`
      .toLocaleLowerCase()
      .includes(query.trim().toLocaleLowerCase()),
  );
  const busy = Boolean(busyId) || (Boolean(guestId) && loading);
  let names: string[] = [];
  try {
    names = splitPersonalGuestNames(name);
  } catch {
    // Invalid names keep Add disabled.
  }
  const minimumPax = minimumInvitedPaxForSalutation(salutation);
  const sessions = weddingSessionsFor(selectedEvent ?? {});
  const manualPaxValid = Number.isInteger(profile.invitedPax)
    && profile.invitedPax >= minimumPax
    && profile.invitedPax <= MAX_GUEST_PARTY_SIZE;
  const valid =
    Boolean(profile.category.trim()) && (sessions.length < 2 || profile.invitedSessions.length > 0) &&
    Boolean(
      guestId
        ? selectedGuest
        : manualPaxValid &&
          names.length &&
          names.every((guestName) =>
            buildPersonalGuestAddressee(guestName, salutation),
          ),
    );
  const envelopeAddress = formatPersonalEnvelopeAddress({
    name: selectedGuest?.name ?? names[0] ?? "",
    ...profile,
    ...(!guestId
      ? {
          personalAddressee: buildPersonalGuestAddressee(
            names[0] ?? "",
            salutation,
          ),
        }
      : {}),
  });

  useEffect(() => {
    const input = nameInputRef.current;
    if (!input) return;
    input.style.height = "auto";
    const maxHeight = 112;
    input.style.height = `${Math.min(Math.max(input.scrollHeight, 44), maxHeight)}px`;
    input.style.overflowY = input.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [name]);

  return (
    <DashboardPanel
      title={d("Daftar nama tamu")}
      actions={
        drafts.length ? (
          <DashboardStatusBadge>
            {drafts.length} · {d("Belum disimpan")}
          </DashboardStatusBadge>
        ) : undefined
      }
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!valid || busy) return;
          if (guestId) onAddExisting();
          else onAddNames();
        }}
        className="space-y-4"
      >
        <WeddingGuestScopeField sessions={sessions} value={profile.invitedSessions} onChange={(invitedSessions) => setProfile({ ...profile, invitedSessions })} disabled={busy} />
        {sessions.length === 2 && <p className="text-xs text-muted-foreground">{locale === "en" ? "Use personal links to limit invited sessions. The general public link shows both sessions." : "Gunakan tautan personal untuk membatasi sesi undangan. Tautan publik umum menampilkan kedua sesi."}</p>}
        <div
          className={
            guestId
              ? "grid max-w-[860px] gap-3 sm:grid-cols-[minmax(240px,420px)_170px_92px_auto] sm:items-end"
              : "grid max-w-[1020px] gap-3 sm:grid-cols-[132px_minmax(240px,420px)] xl:grid-cols-[132px_minmax(260px,420px)_170px_92px_auto] xl:items-end"
          }
        >
          {!guestId && (
            <PersonalInvitationSalutationField
              value={salutation}
              onChange={(next) => {
                setSalutation(next);
                const minimum = minimumInvitedPaxForSalutation(next);
                if (profile.invitedPax < minimum) setProfile({ ...profile, invitedPax: minimum });
              }}
              disabled={busy}
            />
          )}
          <FloatingField label={d("Nama")} className="block min-w-0 text-sm font-medium text-foreground">
            <textarea
              ref={nameInputRef}
              value={name}
              maxLength={121000}
              rows={1}
              onChange={(event) => setName(event.target.value)}
              placeholder={
                salutation === "BAPAK_IBU"
                  ? "Andi & Rina"
                  : salutation === "IBU"
                    ? "Rina"
                    : "Andi"
              }
              required
              disabled={busy}
              className="mt-1.5 block min-h-11 max-h-28 w-full resize-none overflow-y-hidden rounded-[var(--undara-control-radius)] border border-input bg-transparent px-3 py-2 text-base capitalize outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
            />
          </FloatingField>
          <PersonalInvitationGuestFields
            value={profile}
            onChange={setProfile}
            disabled={busy}
          />
          <FloatingField label={d("Jumlah orang")} className="block min-w-0 text-sm font-medium text-foreground">
            <Input
              type="number"
              min={guestId ? 1 : minimumPax}
              max={MAX_GUEST_PARTY_SIZE}
              value={guestId ? selectedGuest?.invitedPax ?? profile.invitedPax : profile.invitedPax}
              readOnly={Boolean(guestId)}
              disabled={busy}
              className="mt-1.5 min-h-11"
              onChange={(event) => setProfile({ ...profile, invitedPax: Number(event.target.value) })}
            />
          </FloatingField>
          <div className="flex items-end">
            <Button type="submit" size="sm" disabled={!valid || busy}>
              <Plus className="size-4" />
              {d("Tambah ke daftar")}
            </Button>
          </div>
        </div>

        <div className="flex max-w-[1020px] flex-col gap-2 border-t border-primary/10 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <p
            className="min-w-0 break-words text-xs text-muted-foreground"
            aria-live="polite"
          >
            <span className="font-medium text-foreground">
              {d("Sapaan di amplop")}:
            </span>{" "}
            {envelopeAddress ||
              (profile.personalEnvelopeEnabled
                ? profile.personalLanguage === "EN"
                  ? "Dear : [Name]"
                  : "Kepada Yth : [Nama tamu]"
                : d("Amplop tanpa nama"))}
          </p>

          {availableGuests.length > 0 && (
            <Dialog
              open={pickerOpen}
              onOpenChange={(open) => {
                setPickerOpen(open);
                if (open) {
                  setQuery("");
                  setLimit(40);
                }
              }}
            >
              <DialogTrigger
                render={
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={busy}
                  />
                }
              >
                <ContactRound className="size-4" />
                {d("Cari dari Daftar Tamu")}
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{d("Daftar tamu")}</DialogTitle>
                  <DialogDescription>
                    {displayTitleCase(selectedEvent?.title ?? "")}
                  </DialogDescription>
                </DialogHeader>
                <FloatingField label={d("Cari nama tamu")}>
                  <Input
                    type="search"
                    value={query}
                    aria-label={d("Cari nama tamu")}
                    placeholder={d("Cari nama tamu")}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setLimit(40);
                    }}
                  />
                </FloatingField>
                <div className="max-h-[45dvh] space-y-1 overflow-y-auto">
                  {matches.slice(0, limit).map((guest) => (
                    <Button
                      key={guest.id}
                      type="button"
                      variant="ghost"
                      disabled={busy}
                      className="h-auto min-h-11 w-full justify-start whitespace-normal py-3 text-left"
                      onClick={() => {
                        setGuestId(guest.id);
                        setPickerOpen(false);
                      }}
                    >
                      <span className="min-w-0">
                        <span className="block break-words">
                          {displayTitleCase(guest.name)}
                        </span>
                        {(guest.phone || guest.category || guest.invitedPax) && (
                          <span className="mt-1 block text-xs text-muted-foreground">
                            {[
                              guest.phone,
                              guest.category === "REGULAR"
                                ? d("Reguler")
                                : guest.category,
                              guest.invitedPax ? `${guest.invitedPax} ${d("orang diundang")}` : null,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                        )}
                      </span>
                    </Button>
                  ))}
                  {!matches.length && (
                    <DashboardEmptyState title={d("Tidak ada hasil")} />
                  )}
                </div>
                {matches.length > limit && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLimit((current) => current + 40)}
                  >
                    {d("Tampilkan lebih banyak")}
                  </Button>
                )}
              </DialogContent>
            </Dialog>
          )}
        </div>
      </form>

      {drafts.length > 0 && (
        <div className="mt-5 border-t border-primary/15 pt-4">
          <div className="hidden max-w-[1020px] grid-cols-[132px_minmax(260px,420px)_170px_92px_44px] gap-3 px-1 pb-2 text-xs font-medium text-muted-foreground xl:grid">
            <span>{d("Sapaan")}</span>
            <span>{d("Nama tamu")}</span>
            <span>{d("Kategori tamu")}</span>
            <span>{d("Jumlah orang")}</span>
            <span className="sr-only">{d("Aksi")}</span>
          </div>
          <div className="max-h-[32rem] overflow-y-auto pr-1">
            {drafts.slice(0, draftLimit).map((draft, index) => (
              <div
                key={draft.key}
                className="grid max-w-[1020px] gap-3 border-t border-primary/10 py-3 first:border-t-0 sm:grid-cols-[132px_minmax(220px,1fr)_170px_92px_44px] sm:items-start xl:grid-cols-[132px_minmax(260px,420px)_170px_92px_44px]"
              >
                {draft.guestId ? (
                  <div className="flex min-h-11 items-center text-xs text-muted-foreground">
                    {d("Tersimpan")}
                  </div>
                ) : (
                  <PersonalInvitationSalutationField
                    value={draft.salutation ?? "BAPAK"}
                    onChange={(nextSalutation) =>
                      onEditDraft(draft.key, {
                        salutation: nextSalutation,
                      })
                    }
                    disabled={Boolean(busyId)}
                    showLabel={false}
                  />
                )}
                <div className="min-w-0">
                  <Input
                    value={draft.name}
                    maxLength={120}
                    readOnly={Boolean(draft.guestId)}
                    disabled={Boolean(busyId)}
                    className="min-h-11 capitalize"
                    aria-label={`${d("Nama tamu")} ${index + 1}`}
                    onChange={(event) =>
                      onEditDraft(draft.key, { name: event.target.value })
                    }
                  />
                  <p className="mt-1.5 break-words text-xs text-muted-foreground">
                    {formatPersonalEnvelopeAddress({
                      ...draft.profile,
                      name: draft.name,
                      ...(!draft.guestId
                        ? {
                            personalAddressee: buildPersonalGuestAddressee(
                              draft.name,
                              draft.salutation ?? "BAPAK",
                            ),
                          }
                        : {}),
                    }) || d("Amplop tanpa nama")}
                  </p>
                </div>
                <PersonalInvitationGuestFields
                  value={{
                    ...emptyGuestInvitationForm,
                    ...draft.profile,
                    category: draft.category,
                  }}
                  onChange={(next) =>
                    onEditDraft(draft.key, { category: next.category })
                  }
                  disabled={Boolean(busyId)}
                  showLabel={false}
                />
                <Input
                  type="number"
                  min={draft.guestId ? 1 : minimumInvitedPaxForSalutation(draft.salutation ?? "BAPAK")}
                  max={MAX_GUEST_PARTY_SIZE}
                  value={draft.guestId ? draft.profile?.invitedPax ?? 1 : draft.invitedPax ?? 1}
                  readOnly={Boolean(draft.guestId)}
                  disabled={Boolean(busyId)}
                  className="min-h-11"
                  aria-label={`${d("Jumlah orang")} ${index + 1}`}
                  onChange={(event) => onEditDraft(draft.key, { invitedPax: Number(event.target.value) })}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="size-11 shrink-0"
                  disabled={Boolean(busyId)}
                  aria-label={`${d("Hapus")}: ${draft.name}`}
                  onClick={() => onRemoveDraft(draft.key)}
                >
                  <Trash2 className="size-4" />
                </Button>
                <div className="col-span-full"><WeddingGuestScopeField sessions={sessions} value={draft.invitedSessions} onChange={(invitedSessions) => onEditDraft(draft.key, { invitedSessions })} disabled={Boolean(busyId)} /></div>
              </div>
            ))}
          </div>
          {drafts.length > draftLimit && (
            <Button
              type="button"
              variant="outline"
              disabled={Boolean(busyId)}
              onClick={() => setDraftLimit((current) => current + 40)}
            >
              {d("Tampilkan lebih banyak")}
            </Button>
          )}
        </div>
      )}
    </DashboardPanel>
  );
}

export function PersonalInvitationListPanel({
  selectedEvent,
  personal,
  editingId,
  editName,
  setEditName,
  editPhone,
  setEditPhone,
  editProfile,
  setEditProfile,
  passwordId,
  setPasswordId,
  password,
  setPassword,
  busyId,
  loading,
  onReload,
  onStartEdit,
  onSaveEdit,
  onPatch,
  onSavePassword,
  onDisablePassword,
  onPublishAll,
  onPublishSelected,
  onCopyLink,
}: {
  selectedEvent: PersonalInvitationEvent;
  personal: PersonalInvitationItem[];
  editingId: string | null;
  editName: string;
  setEditName: (value: string) => void;
  editPhone: string;
  setEditPhone: (value: string) => void;
  editProfile: GuestInvitationForm;
  setEditProfile: (value: GuestInvitationForm) => void;
  passwordId: string | null;
  setPasswordId: (value: string | null) => void;
  password: string;
  setPassword: (value: string) => void;
  busyId: string | null;
  loading: boolean;
  onReload: () => void;
  onStartEdit: (item: PersonalInvitationItem) => void;
  onSaveEdit: (item: PersonalInvitationItem) => void;
  onPatch: (
    id: string,
    body: Record<string, unknown>,
    successMessage: string,
  ) => Promise<boolean>;
  onSavePassword: (item: PersonalInvitationItem) => void;
  onDisablePassword: (item: PersonalInvitationItem) => void;
  onPublishAll: () => void;
  onPublishSelected: (ids: string[]) => void;
  onCopyLink: (item: PersonalInvitationItem) => void;
}) {
  const { d, locale } = useDashboardI18n();
  const sessions = weddingSessionsFor(selectedEvent);
  const [selection, setSelection] = useState<{
    eventId: string;
    ids: string[];
  }>({ eventId: selectedEvent.id, ids: [] });
  const [settings, setSettings] = useState<{
    eventId: string;
    id: string | null;
  }>({ eventId: selectedEvent.id, id: null });
  const selectedIds =
    selection.eventId === selectedEvent.id ? selection.ids : [];
  const settingsId =
    settings.eventId === selectedEvent.id ? settings.id : null;
  const canPublish = selectedEvent.isPublished && selectedEvent.accessPaid;
  const busy = Boolean(busyId);
  const selectedSet = new Set(selectedIds);
  const selectedUnpublished = personal
    .filter((item) => selectedSet.has(item.id) && !item.personalPublished)
    .map((item) => item.id);
  const allSelected =
    personal.length > 0 && personal.every((item) => selectedSet.has(item.id));
  const publishedCount = personal.filter((item) => item.personalPublished).length;
  const totalViews = personal.reduce(
    (sum, item) => sum + (item.personalViewCount || 0),
    0,
  );

  function updateSelection(
    next: string[] | ((current: string[]) => string[]),
  ) {
    setSelection((current) => {
      const currentIds =
        current.eventId === selectedEvent.id ? current.ids : [];
      return {
        eventId: selectedEvent.id,
        ids: typeof next === "function" ? next(currentIds) : next,
      };
    });
  }

  function toggleSelected(id: string, checked: boolean) {
    updateSelection((current) => {
      if (checked) return current.includes(id) ? current : [...current, id];
      return current.filter((value) => value !== id);
    });
  }

  return (
    <DashboardPanel
      title={displayTitleCase(selectedEvent.title.trim() || d("Daftar undangan"))}
      actions={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className="mr-1 text-xs text-muted-foreground">
            {personal.length} {d("Tamu")} · {publishedCount} {d("Publish")} ·{" "}
            {totalViews} {d("Dibuka")}
          </span>
          {selectedUnpublished.length > 0 ? (
            <Button
              type="button"
              size="sm"
              disabled={loading || busy || !canPublish}
              onClick={() => onPublishSelected(selectedUnpublished)}
            >
              <Send className="size-4" />
              {d("Publish terpilih")} ({selectedUnpublished.length})
            </Button>
          ) : (
            personal.some((item) => !item.personalPublished) && (
              <Button
                type="button"
                size="sm"
                disabled={loading || busy || !canPublish}
                onClick={onPublishAll}
              >
                <Send className="size-4" />
                {d("Publish semua")}
              </Button>
            )
          )}
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="size-9"
            onClick={onReload}
            disabled={loading || busy}
            aria-label={d("Muat ulang")}
            title={d("Muat ulang")}
          >
            <RefreshCw className="size-4" />
          </Button>
        </div>
      }
    >
      {personal.length === 0 ? (
        <DashboardEmptyState
          icon={ContactRound}
          title={d("Belum ada Personal Invitation")}
          description={d(
            "Tambahkan nama ke daftar, lalu pilih undangan dan buat tautan personal.",
          )}
        />
      ) : (
        <div role="table" aria-label={d("Daftar tamu")} className="min-w-0">
          <div
            role="row"
            className="hidden border-b border-primary/15 px-1 pb-2 text-xs font-medium text-muted-foreground lg:grid lg:grid-cols-[40px_minmax(220px,1.6fr)_110px_105px_68px_180px_96px] lg:items-center lg:gap-3"
          >
            <span role="columnheader" className="flex justify-center">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(event) =>
                  updateSelection(
                    event.target.checked
                      ? personal.map((item) => item.id)
                      : [],
                  )
                }
                aria-label={d("Pilih semua tamu")}
                className="size-4 accent-primary"
              />
            </span>
            <span role="columnheader">{d("Nama tamu")}</span>
            <span role="columnheader">{d("Kategori tamu")}</span>
            <span role="columnheader">{d("Status")}</span>
            <span role="columnheader">{d("Dibuka")}</span>
            <span role="columnheader">{d("Aksi")}</span>
            <span role="columnheader" className="text-right">
              {d("Kirim")}
            </span>
          </div>

          <div role="rowgroup">
            {personal.map((item) => {
              const publicUrl = buildPersonalInvitationPublicUrl(
                selectedEvent.slug,
                item.personalToken,
              );
              const editing = editingId === item.id;
              const passwordOpen = passwordId === item.id;
              const settingsOpen = settingsId === item.id;
              const personalEnvelopeAddress = formatPersonalEnvelopeAddress(item);
              const canSend =
                canPublish && item.personalPublished && Boolean(publicUrl);
              const category =
                !item.category || item.category === "REGULAR"
                  ? d("Reguler")
                  : displayTitleCase(item.category);
              const status = item.personalPublished ? d("Terbit") : d("Draft");

              return (
                <div
                  key={item.id}
                  role="row"
                  className="grid grid-cols-[32px_minmax(0,1fr)_auto] gap-x-3 border-b border-primary/10 px-1 py-4 last:border-b-0 lg:grid-cols-[40px_minmax(220px,1.6fr)_110px_105px_68px_180px_96px] lg:items-center lg:gap-3"
                >
                  <div role="cell" className="flex justify-center pt-1 lg:pt-0">
                    <input
                      type="checkbox"
                      checked={selectedSet.has(item.id)}
                      onChange={(event) =>
                        toggleSelected(item.id, event.target.checked)
                      }
                      aria-label={`${d("Pilih tamu")}: ${item.name}`}
                      className="size-4 accent-primary"
                    />
                  </div>

                  <div role="cell" className="min-w-0">
                    <p className="break-words text-sm font-semibold text-foreground">
                      <span className="undara-ui-name">
                        {item.personalAddressee || item.name}
                      </span>
                    </p>
                    {item.personalAddressee &&
                      item.personalAddressee !== item.name && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {d("Data tamu")}:{" "}
                          <span className="undara-ui-name">{item.name}</span>
                        </p>
                      )}
                    {sessions.length > 0 && <p className="mt-1 break-words text-xs text-muted-foreground">{sessions.filter((session) => item.invitedSessions?.includes(session.id)).map((session) => weddingSessionLabel(session, locale === "en" ? "EN" : "ID")).join(" · ") || (locale === "en" ? "Choose sessions" : "Pilih sesi")}</p>}
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {item.phone || d("Tanpa nomor")}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground lg:hidden">
                      {category} · {status} · {item.personalViewCount || 0}{" "}
                      {d("kali dibuka")}
                    </p>
                  </div>

                  <div
                    role="cell"
                    className="hidden text-sm text-foreground lg:block"
                  >
                    {category}
                  </div>
                  <div role="cell" className="hidden lg:block">
                    <DashboardStatusBadge active={item.personalPublished}>
                      {status}
                    </DashboardStatusBadge>
                  </div>
                  <div
                    role="cell"
                    className="hidden text-sm tabular-nums text-foreground lg:block"
                  >
                    {item.personalViewCount || 0}
                  </div>

                  <div
                    role="cell"
                    className="col-span-2 col-start-2 mt-2 flex flex-wrap items-center gap-1 lg:col-span-1 lg:col-start-auto lg:mt-0"
                  >
                    <Button
                      asChild
                      size="icon"
                      variant="ghost"
                      className="size-9"
                    >
                      <Link
                        href={`/dashboard/personal-invitation/${item.id}`}
                        target="_blank"
                        aria-label={`${d("Pratinjau")}: ${item.name}`}
                        title={d("Pratinjau")}
                      >
                        <Eye className="size-4" />
                      </Link>
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-9"
                      disabled={busy}
                      aria-label={`${d("Edit")}: ${item.name}`}
                      title={d("Edit")}
                      onClick={() => onStartEdit(item)}
                    >
                      <PenLine className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-9"
                      disabled={busy || (!item.personalPublished && !canPublish)}
                      aria-label={
                        item.personalPublished
                          ? `${d("Tarik publik")}: ${item.name}`
                          : `${d("Publish")}: ${item.name}`
                      }
                      title={
                        item.personalPublished
                          ? d("Tarik publik")
                          : d("Publish")
                      }
                      onClick={() =>
                        onPatch(
                          item.id,
                          { published: !item.personalPublished },
                          item.personalPublished
                            ? d("Personal Invitation ditarik dari publik.")
                            : d("Personal Invitation dipublish."),
                        )
                      }
                    >
                      <Send className="size-4" />
                    </Button>
                    {canSend && (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-9"
                        disabled={busy}
                        aria-label={`${d("Salin tautan")}: ${item.name}`}
                        title={d("Salin tautan")}
                        onClick={() => onCopyLink(item)}
                      >
                        <Copy className="size-4" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-9"
                      disabled={busy}
                      aria-label={`${d("Pengaturan")}: ${item.name}`}
                      title={d("Pengaturan")}
                      aria-expanded={settingsOpen}
                      onClick={() => {
                        setSettings({
                          eventId: selectedEvent.id,
                          id: settingsOpen ? null : item.id,
                        });
                        if (settingsOpen) setPasswordId(null);
                      }}
                    >
                      <Settings2 className="size-4" />
                    </Button>
                  </div>

                  <div
                    role="cell"
                    className="col-start-3 row-start-1 flex justify-end lg:col-start-auto lg:row-start-auto"
                  >
                    {canSend ? (
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="min-w-20"
                      >
                        <a
                          href={buildPersonalInvitationWhatsAppUrl(
                            selectedEvent,
                            item,
                          )}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`${d("Kirim")}: ${item.name}`}
                        >
                          <Send className="size-4" />
                          {d("Kirim")}
                        </a>
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="min-w-20"
                        disabled
                        aria-label={`${d("Kirim")}: ${item.name}`}
                      >
                        <Send className="size-4" />
                        {d("Kirim")}
                      </Button>
                    )}
                  </div>

                  {editing && (
                    <div className="col-span-full mt-3 border-t border-primary/10 pt-3">
                      <div className="grid max-w-4xl gap-3 md:grid-cols-[minmax(220px,1fr)_minmax(200px,1fr)_170px_auto] md:items-end">
                        <FloatingField label={d("Nama penerima")} className="text-sm font-medium text-foreground">
                          <Input
                            disabled={busy}
                            value={editName}
                            maxLength={120}
                            onChange={(event) => setEditName(event.target.value)}
                            className="mt-1.5 capitalize"
                          />
                        </FloatingField>
                        <FloatingField label={d("Nomor WhatsApp (opsional)")} className="text-sm font-medium text-foreground">
                          <Input
                            disabled={busy}
                            type="tel"
                            maxLength={32}
                            value={editPhone}
                            onChange={(event) => setEditPhone(event.target.value)}
                            className="mt-1.5"
                          />
                        </FloatingField>
                        <PersonalInvitationGuestFields
                          value={editProfile}
                          onChange={setEditProfile}
                          disabled={busy}
                        />
                        <WeddingGuestScopeField sessions={sessions} value={editProfile.invitedSessions} onChange={(invitedSessions) => setEditProfile({ ...editProfile, invitedSessions })} disabled={busy || item.checkedIn} />
                        <Button
                          type="button"
                          size="sm"
                          disabled={busy || !editName.trim()}
                          onClick={() => onSaveEdit(item)}
                        >
                          {d("Simpan edit")}
                        </Button>
                      </div>
                    </div>
                  )}

                  {settingsOpen && (
                    <div className="col-span-full mt-3 border-t border-primary/10 pt-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() =>
                            onPatch(
                              item.id,
                              {
                                personalEnvelopeEnabled: item.personalEnvelopeEnabled === false,
                              },
                              item.personalEnvelopeEnabled === false
                                ? d("Nama penerima di amplop diaktifkan.")
                                : d("Nama penerima di amplop dimatikan."),
                            )
                          }
                        >
                          {item.personalEnvelopeEnabled === false
                            ? d("Aktifkan nama amplop")
                            : d("Matikan nama amplop")}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => {
                            setPasswordId(passwordOpen ? null : item.id);
                            setPassword("");
                          }}
                        >
                          <KeyRound className="size-4" />
                          {item.personalPasswordProtected
                            ? d("Ganti password")
                            : d("Aktifkan password")}
                        </Button>
                        {item.personalPasswordProtected && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() => onDisablePassword(item)}
                          >
                            <ShieldOff className="size-4" />
                            {d("Matikan password")}
                          </Button>
                        )}
                        {canSend && (
                          <>
                            <Button asChild size="sm" variant="outline">
                              <a
                                href={publicUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {d("Buka publik")}
                              </a>
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={busy}
                              onClick={() =>
                                onPatch(
                                  item.id,
                                  { markShared: !item.personalSharedAt },
                                  item.personalSharedAt
                                    ? d("Penanda dibagikan dibatalkan.")
                                    : d(
                                        "Ditandai dibagikan secara manual; status pengiriman WhatsApp tidak diverifikasi.",
                                      ),
                                )
                              }
                            >
                              {item.personalSharedAt
                                ? d("Batalkan tanda dibagikan")
                                : d("Tandai dibagikan")}
                            </Button>
                          </>
                        )}
                      </div>

                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {personalEnvelopeAddress && (
                          <span>
                            {d("Amplop personal")}:{" "}
                            <span className="undara-ui-name">
                              {personalEnvelopeAddress}
                            </span>
                          </span>
                        )}
                        <span>
                          {item.rsvpStatus === "ATTENDING"
                            ? `${d("Hadir")} · ${(item.plusOnes ?? 0) + 1} pax`
                            : item.rsvpStatus === "NOT_ATTENDING"
                              ? d("Tidak hadir")
                              : item.rsvpStatus === "TENTATIVE"
                                ? d("Tentatif")
                                : d("Belum RSVP")}
                        </span>
                        {item.checkedIn && <span>{d("Sudah check-in")}</span>}
                        {item.table?.name && (
                          <span>
                            {d("Meja")}: {item.table.name}
                          </span>
                        )}
                      </div>

                      {passwordOpen && (
                        <div className="mt-3 flex max-w-xl flex-col gap-2 sm:flex-row sm:items-center">
                          <FloatingField label={d("Password baru")} className="min-w-0 flex-1">
                            <Input
                              disabled={busy}
                              type="password"
                              value={password}
                              onChange={(event) =>
                                setPassword(event.target.value)
                              }
                              placeholder={d("Password baru minimal 6 karakter")}
                              className="min-w-0 flex-1"
                            />
                          </FloatingField>
                          <Button
                            type="button"
                            size="sm"
                            disabled={password.trim().length < 6 || busy}
                            onClick={() => onSavePassword(item)}
                          >
                            {d("Simpan password")}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </DashboardPanel>
  );
}
