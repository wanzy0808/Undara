"use client";

import { useState } from "react";
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
  onEditDraft: (key: string, value: { name?: string; category?: string; salutation?: PersonalSalutation }) => void;
}) {
  const { d } = useDashboardI18n();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(40);
  const [draftLimit, setDraftLimit] = useState(40);
  const selectedGuest = availableGuests.find((guest) => guest.id === guestId);
  const matches = availableGuests.filter((guest) =>
    `${guest.name} ${guest.phone ?? ""}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
  );
  const busy = Boolean(busyId) || (Boolean(guestId) && loading);
  let names: string[] = [];
  try { names = splitPersonalGuestNames(name); } catch { /* Invalid names keep Add disabled. */ }
  const valid = Boolean(profile.category.trim()) && Boolean(guestId ? selectedGuest : names.length && names.every((name) => buildPersonalGuestAddressee(name, salutation)));
  const envelopeAddress = formatPersonalEnvelopeAddress({ name: selectedGuest?.name ?? names[0] ?? "", ...profile,
    ...(!guestId ? { personalAddressee: buildPersonalGuestAddressee(names[0] ?? "", salutation) } : {}),
  });

  return (
    <DashboardPanel title={d("Daftar nama tamu")} actions={drafts.length ? <DashboardStatusBadge>{drafts.length} · {d("Belum disimpan")}</DashboardStatusBadge> : undefined}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!valid || busy) return;
          if (guestId) onAddExisting();
          else onAddNames();
        }}
        className="space-y-5"
      >
        <div className="space-y-2">
          <div className={`grid gap-3 ${guestId ? "" : "sm:grid-cols-[160px_minmax(0,1fr)]"}`}>
          {!guestId && <PersonalInvitationSalutationField value={salutation} onChange={setSalutation} disabled={busy} />}
          <label className="block min-w-0 text-sm font-medium text-foreground">
            {d("Nama")}
            <textarea value={name} maxLength={121000} rows={2} onChange={(event) => setName(event.target.value)}
              placeholder={salutation === "BAPAK_IBU" ? "Andi & Rina" : salutation === "IBU" ? "Rina" : "Andi"} required disabled={busy}
              className="mt-1.5 block min-h-20 w-full resize-y rounded-[var(--undara-control-radius)] border border-input bg-transparent px-3 py-2 text-base outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm" />
          </label>
          </div>
          {availableGuests.length > 0 && (
            <Dialog open={pickerOpen} onOpenChange={(open) => { setPickerOpen(open); if (open) { setQuery(""); setLimit(40); } }}>
              <DialogTrigger render={<Button type="button" size="sm" variant="outline" disabled={busy} />}>
                <ContactRound className="size-4" />{d("Pilih tamu tersimpan")}
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{d("Daftar tamu")}</DialogTitle>
                  <DialogDescription>{displayTitleCase(selectedEvent?.title ?? "")}</DialogDescription>
                </DialogHeader>
                <Input type="search" value={query} aria-label={d("Cari nama tamu")}
                  placeholder={d("Cari nama tamu")} onChange={(event) => { setQuery(event.target.value); setLimit(40); }} />
                <div className="max-h-[45dvh] space-y-1 overflow-y-auto">
                  {matches.slice(0, limit).map((guest) => (
                    <Button key={guest.id} type="button" variant="ghost" disabled={busy}
                      className="h-auto min-h-11 w-full justify-start whitespace-normal py-3 text-left"
                      onClick={() => { setGuestId(guest.id); setPickerOpen(false); }}>
                      <span className="min-w-0">
                        <span className="block break-words">{displayTitleCase(guest.name)}</span>
                        {(guest.phone || guest.category) && <span className="mt-1 block text-xs text-muted-foreground">{[guest.phone, guest.category === "REGULAR" ? d("Reguler") : guest.category].filter(Boolean).join(" · ")}</span>}
                      </span>
                    </Button>
                  ))}
                  {!matches.length && <DashboardEmptyState title={d("Tidak ada hasil")} />}
                </div>
                {matches.length > limit && <Button type="button" variant="outline" onClick={() => setLimit((current) => current + 40)}>{d("Tampilkan lebih banyak")}</Button>}
              </DialogContent>
            </Dialog>
          )}
        </div>

        <PersonalInvitationGuestFields value={profile} onChange={setProfile} disabled={busy} />

        <div className="border-y border-primary/15 py-3" aria-live="polite">
          <p className="text-xs text-muted-foreground">{d("Sapaan di amplop")}</p>
          <p className="mt-1 break-words text-sm font-medium text-foreground">
            {envelopeAddress || (profile.personalEnvelopeEnabled ? profile.personalLanguage === "EN" ? "Dear : [Name]" : "Kepada Yth : [Nama tamu]" : d("Amplop tanpa nama"))}
          </p>
        </div>

        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={!valid || busy}>
            <Plus className="size-4" />
            {d("Tambah ke daftar")}
          </Button>
        </div>
      </form>

      {drafts.length > 0 && (
        <div className="mt-5 space-y-3 border-t border-primary/15 pt-4">
          <div className="max-h-[32rem] space-y-3 overflow-y-auto pr-1">
            {drafts.slice(0, draftLimit).map((draft, index) => (
              <div key={draft.key} className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2 border-b border-primary/10 pb-3 sm:grid-cols-[minmax(0,1fr)_minmax(140px,0.4fr)_auto]">
                <div className="col-span-2 min-w-0 sm:col-span-1">
                  <div className={`grid items-end gap-2 ${draft.guestId ? "" : "sm:grid-cols-[150px_minmax(0,1fr)]"}`}>
                    {!draft.guestId && <PersonalInvitationSalutationField value={draft.salutation ?? "BAPAK"}
                      onChange={(salutation) => onEditDraft(draft.key, { salutation })} disabled={Boolean(busyId)} />}
                    <Input value={draft.name} maxLength={120} readOnly={Boolean(draft.guestId)} disabled={Boolean(busyId)} className="min-h-11"
                      aria-label={`${d("Nama tamu")} ${index + 1}`}
                      onChange={(event) => onEditDraft(draft.key, { name: event.target.value })} />
                  </div>
                  <p className="mt-1.5 break-words text-xs text-muted-foreground">{formatPersonalEnvelopeAddress({ ...draft.profile, name: draft.name,
                    ...(!draft.guestId ? { personalAddressee: buildPersonalGuestAddressee(draft.name, draft.salutation ?? "BAPAK") } : {}),
                  }) || d("Amplop tanpa nama")}</p>
                </div>
                <PersonalInvitationGuestFields value={{ ...emptyGuestInvitationForm, ...draft.profile, category: draft.category }}
                  onChange={(next) => onEditDraft(draft.key, { category: next.category })} disabled={Boolean(busyId)} />
                <Button type="button" size="icon" variant="ghost" className="size-11 shrink-0" disabled={Boolean(busyId)} aria-label={`${d("Hapus")}: ${draft.name}`}
                  onClick={() => onRemoveDraft(draft.key)}><Trash2 className="size-4" /></Button>
              </div>
            ))}
          </div>
          {drafts.length > draftLimit && <Button type="button" variant="outline" disabled={Boolean(busyId)} onClick={() => setDraftLimit((current) => current + 40)}>{d("Tampilkan lebih banyak")}</Button>}
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
  onCopyLink: (item: PersonalInvitationItem) => void;
}) {
  const { d } = useDashboardI18n();
  const canPublish = selectedEvent.isPublished && selectedEvent.accessPaid;
  const busy = Boolean(busyId);

  return (
    <DashboardPanel
      title={displayTitleCase(selectedEvent.title.trim() || d("Daftar undangan"))}
      actions={
        <div className="flex flex-wrap gap-2">
        {personal.some((item) => !item.personalPublished) && <Button type="button" size="sm" disabled={loading || busy || !canPublish} onClick={onPublishAll}><Send className="size-4" />{d("Publish semua")}</Button>}
        <Button
          type="button"
          size="sm"
          onClick={onReload}
          disabled={loading || busy}
        >
          <RefreshCw className="h-4 w-4" />
          {d("Muat ulang")}
        </Button>
        </div>
      }
    >
      <div className="space-y-3">
        {personal.length === 0 && (
          <DashboardEmptyState
            icon={ContactRound}
            title={d("Belum ada Personal Invitation")}
            description={d(
              "Tambahkan nama ke daftar, lalu pilih undangan dan simpan.",
            )}
          />
        )}

        {personal.map((item) => {
          const publicUrl = buildPersonalInvitationPublicUrl(
            selectedEvent.slug,
            item.personalToken,
          );
          const editing = editingId === item.id;
          const passwordOpen = passwordId === item.id;
          const personalEnvelopeAddress = formatPersonalEnvelopeAddress(item);

          return (
            <article
              key={item.id}
              className="undara-dashboard-detail-card rounded-tr-[22px] border border-primary/20 bg-primary/[0.025] p-4 sm:p-5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  {editing ? (
                    <div className="space-y-4">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <label className="text-sm font-medium text-foreground">
                          {d("Nama penerima")}
                          <Input
                            disabled={busy}
                            value={editName}
                            maxLength={120}
                            onChange={(event) => setEditName(event.target.value)}
                            className="mt-1.5"
                          />
                        </label>
                        <label className="text-sm font-medium text-foreground">
                          {d("Nomor WhatsApp (opsional)")}
                          <Input
                            disabled={busy}
                            type="tel"
                            maxLength={32}
                            value={editPhone}
                            onChange={(event) => setEditPhone(event.target.value)}
                            className="mt-1.5"
                          />
                        </label>
                      </div>
                      <PersonalInvitationGuestFields
                        value={editProfile}
                        onChange={setEditProfile}
                        disabled={busy}
                      />
                    </div>
                  ) : (
                    <>
                      <p className="break-words text-sm font-semibold text-foreground">
                        <span className="undara-ui-name">{item.personalAddressee || item.name}</span>
                      </p>
                      {item.personalAddressee && item.personalAddressee !== item.name && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {d("Data tamu")}: <span className="undara-ui-name">{item.name}</span>
                        </p>
                      )}
                      <p className="mt-1 break-words text-xs text-muted-foreground">
                        {item.phone || d("Tanpa nomor")} · {item.personalViewCount || 0} {d("kali dibuka")}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {!item.category || item.category === "REGULAR" ? d("Reguler") : item.category} · {item.invitedPax ?? 1} {d("orang diundang")}
                        {(item.tags?.length ?? 0) > 0 ? ` · ${item.tags?.join(", ")}` : ""}
                      </p>
                      {item.personalGreeting && (
                        <p className="mt-1 break-words text-xs italic text-muted-foreground">
                          {item.personalGreeting}
                        </p>
                      )}
                      {personalEnvelopeAddress && (
                        <p className="mt-2 break-words rounded-[var(--undara-control-radius)] border border-primary/15 bg-primary/[.035] px-3 py-2 text-xs text-foreground">
                          <span className="mr-1 font-semibold text-primary">{d("Amplop personal")}:</span>
                          <span className="undara-ui-name">{personalEnvelopeAddress}</span>
                        </p>
                      )}
                    </>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm">
                    <Link
                      href={`/dashboard/personal-invitation/${item.id}`}
                      target="_blank"
                    >
                      <Eye className="h-4 w-4" />
                      {d("Pratinjau")}
                    </Link>
                  </Button>

                  {editing ? (
                    <Button
                      type="button"
                      size="sm"
                      disabled={busy}
                      onClick={() => onSaveEdit(item)}
                    >
                      {d("Simpan edit")}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      disabled={busy}
                      onClick={() => onStartEdit(item)}
                    >
                      <PenLine className="h-4 w-4" />
                      {d("Edit")}
                    </Button>
                  )}

                  <Button
                    type="button"
                    size="sm"
                    disabled={busy || (!item.personalPublished && !canPublish)}
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
                    <Send className="h-4 w-4" />
                    {item.personalPublished ? d("Tarik publik") : d("Publish")}
                  </Button>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <DashboardStatusBadge active={item.personalPublished}>
                  {item.personalPublished ? d("Terbit") : d("Draft")}
                </DashboardStatusBadge>
                <DashboardStatusBadge active={Boolean(item.personalSharedAt)}>
                  {item.personalSharedAt ? d("Ditandai dibagikan") : d("Belum dibagikan")}
                </DashboardStatusBadge>
                <DashboardStatusBadge active={item.rsvpStatus === "ATTENDING"}>
                  {item.rsvpStatus === "ATTENDING"
                    ? `${d("Hadir")} · ${(item.plusOnes ?? 0) + 1} pax`
                    : item.rsvpStatus === "NOT_ATTENDING"
                      ? d("Tidak hadir")
                      : item.rsvpStatus === "TENTATIVE"
                        ? d("Tentatif")
                        : d("Belum RSVP")}
                </DashboardStatusBadge>
                {item.checkedIn && (
                  <DashboardStatusBadge active>{d("Sudah check-in")}</DashboardStatusBadge>
                )}
                {item.table?.name && (
                  <span className="text-xs text-muted-foreground">{d("Meja")}: {item.table.name}</span>
                )}
                <DashboardStatusBadge
                  active={item.personalPasswordProtected}
                >
                  {item.personalPasswordProtected
                    ? d("Password aktif")
                    : d("Tanpa password")}
                </DashboardStatusBadge>
                <DashboardStatusBadge active={item.personalEnvelopeEnabled !== false}>
                  {item.personalEnvelopeEnabled !== false ? d("Nama amplop aktif") : d("Nama amplop mati")}
                </DashboardStatusBadge>

                <Button
                  type="button"
                  size="sm"
                  disabled={busy}
                  onClick={() => onPatch(
                    item.id,
                    { personalEnvelopeEnabled: item.personalEnvelopeEnabled === false },
                    item.personalEnvelopeEnabled === false
                      ? d("Nama penerima di amplop diaktifkan.")
                      : d("Nama penerima di amplop dimatikan."),
                  )}
                >
                  {item.personalEnvelopeEnabled === false
                    ? d("Aktifkan nama amplop")
                    : d("Matikan nama amplop")}
                </Button>

                <Button
                  type="button"
                  size="sm"
                  disabled={busy}
                  onClick={() => {
                    setPasswordId(passwordOpen ? null : item.id);
                    setPassword("");
                  }}
                >
                  <KeyRound className="h-4 w-4" />
                  {item.personalPasswordProtected
                    ? d("Ganti password")
                    : d("Aktifkan password")}
                </Button>

                {item.personalPasswordProtected && (
                  <Button
                    type="button"
                    size="sm"
                    disabled={busy}
                    onClick={() => onDisablePassword(item)}
                  >
                    <ShieldOff className="h-4 w-4" />
                    {d("Matikan password")}
                  </Button>
                )}

                {item.personalPublished && canPublish && publicUrl && (
                  <>
                    <Button type="button" size="sm" disabled={busy} onClick={() => onCopyLink(item)}><Copy className="size-4" />{d("Salin tautan")}</Button>
                    <Button asChild size="sm" variant="outline"><a href={buildPersonalInvitationWhatsAppUrl(selectedEvent, item)} target="_blank" rel="noreferrer"><Send className="size-4" />{d("Kirim WhatsApp")}</a></Button>
                    <Button asChild size="sm">
                      <a href={publicUrl} target="_blank" rel="noreferrer">
                        {d("Buka publik")}
                      </a>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={busy}
                      onClick={() => onPatch(
                        item.id,
                        { markShared: !item.personalSharedAt },
                        item.personalSharedAt
                          ? d("Penanda dibagikan dibatalkan.")
                          : d("Ditandai dibagikan secara manual; status pengiriman WhatsApp tidak diverifikasi."),
                      )}
                    >
                      {item.personalSharedAt ? d("Batalkan tanda dibagikan") : d("Tandai dibagikan")}
                    </Button>
                  </>
                )}
              </div>

              {passwordOpen && (
                <div className="mt-4 flex flex-col gap-2 border-t border-primary/20 pt-4 sm:flex-row sm:items-center">
                  <Input
                    disabled={busy}
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={d("Password baru minimal 6 karakter")}
                    className="min-w-0 flex-1"
                  />
                  <Button
                    type="button"
                    size="sm"
                    disabled={
                      password.trim().length < 6 || busy
                    }
                    onClick={() => onSavePassword(item)}
                  >
                    {d("Simpan password")}
                  </Button>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </DashboardPanel>
  );
}
