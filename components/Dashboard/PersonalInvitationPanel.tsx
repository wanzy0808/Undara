"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ContactRound, Eye, Send } from "lucide-react";
import EventScopePicker from "@/components/Dashboard/EventScopePicker";
import { Button } from "@/components/ui/button";
import { useDashboardI18n } from "@/components/Dashboard/useDashboardI18n";
import {
  DashboardMetricCard,
  DashboardEmptyState,
  DashboardMetricGrid,
  DashboardNotice,
  DashboardPage,
  DashboardPageHeader,
} from "@/components/Dashboard/DashboardPrimitives";
import {
  PersonalInvitationCreatePanel,
  PersonalInvitationListPanel,
} from "@/components/Dashboard/PersonalInvitationPanels";
import { buildPersonalInvitationPublicUrl, sortPersonalInvitationEvents, splitPersonalGuestNames } from "@/components/Dashboard/personal-invitation-helpers";
import {
  emptyGuestInvitationForm,
  guestInvitationFormFrom,
  type GuestInvitationForm,
} from "@/components/Dashboard/PersonalInvitationGuestFields";
import type {
  PersonalInvitationEvent,
  PersonalInvitationDraft,
  PersonalInvitationGuest,
  PersonalInvitationItem,
} from "@/components/Dashboard/personal-invitation-types";

export default function PersonalInvitationPanel({
  selectedEventId,
  onSelectEvent,
}: {
  selectedEventId: string;
  onSelectEvent: (id: string) => void;
}) {
  const { d } = useDashboardI18n();
  const [events, setEvents] = useState<PersonalInvitationEvent[]>([]);
  const [eventId, setEventId] = useState("");
  const activeEventId = useRef(eventId);
  const [personal, setPersonal] = useState<PersonalInvitationItem[]>([]);
  const [guests, setGuests] = useState<PersonalInvitationGuest[]>([]);
  const [dataEventId, setDataEventId] = useState("");
  const loadRequest = useRef<AbortController | null>(null);
  const eventRequest = useRef<AbortController | null>(null);
  const creating = useRef(false);
  const stagedInput = useRef<string | null>(null);
  const [guestId, setGuestId] = useState("");
  const [name, setName] = useState("");
  const [drafts, setDrafts] = useState<PersonalInvitationDraft[]>([]);
  const [profile, setProfile] = useState<GuestInvitationForm>({ ...emptyGuestInvitationForm });
  const [editProfile, setEditProfile] = useState<GuestInvitationForm>({ ...emptyGuestInvitationForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [passwordId, setPasswordId] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");

  const savedEvents = useMemo(
    () => events.filter((event) => Boolean(event.templateKey?.trim())),
    [events],
  );
  const selectedEvent = useMemo(
    () => savedEvents.find((event) => event.id === eventId) ?? null,
    [savedEvents, eventId],
  );
  const designEvent = selectedEvent ?? events.find((event) => event.id === selectedEventId) ?? events[0];

  useEffect(() => { activeEventId.current = eventId; }, [eventId]);

  const loadEvents = useCallback(async () => {
    eventRequest.current?.abort();
    const request = new AbortController();
    eventRequest.current = request;
    setEventsLoading(true);
    setNotice("");

    try {
      const response = await fetch("/api/invitations?all=1", {
        cache: "no-store",
        signal: request.signal,
      });
      const data = await response.json().catch(() => null);
      if (request.signal.aborted) return;

      if (!response.ok) {
        throw new Error(data?.error || d("Daftar acara belum dapat dimuat."));
      }

      const configured = sortPersonalInvitationEvents(
        ((data?.invitations ?? []) as PersonalInvitationEvent[]).filter(
          (invitation) => invitation.eventConfigured,
        ),
      );

      setEvents(configured);
      const saved = configured.filter((event) => Boolean(event.templateKey?.trim()));
      setEventId((current) => {
        if (selectedEventId && saved.some((event) => event.id === selectedEventId)) {
          return selectedEventId;
        }
        if (saved.some((event) => event.id === current)) return current;
        return saved.find((event) => event.accessPaid)?.id ?? saved[0]?.id ?? "";
      });
    } catch (error) {
      if (request.signal.aborted) return;
      setEvents([]);
      setEventId("");
      setNotice(
        error instanceof Error
          ? error.message
          : d("Daftar acara belum dapat dimuat."),
      );
    } finally {
      if (!request.signal.aborted) setEventsLoading(false);
    }
  }, [d, selectedEventId]);

  useEffect(() => {
    if (selectedEventId && savedEvents.some((event) => event.id === selectedEventId)) {
      setEventId(selectedEventId);
    }
  }, [selectedEventId, savedEvents]);

  const loadCurrent = useCallback(async () => {
    if (activeEventId.current !== eventId) return;
    loadRequest.current?.abort();
    const request = new AbortController();
    loadRequest.current = request;

    if (!eventId) {
      setPersonal([]);
      setGuests([]);
      setDataEventId("");
      setLoading(false);
      return;
    }

    setLoading(true);
    setNotice("");

    try {
      const encodedId = encodeURIComponent(eventId);
      const [personalResponse, guestResponse] = await Promise.all([
        fetch(`/api/personal-invitations?invitationId=${encodedId}`, {
          cache: "no-store",
          signal: request.signal,
        }),
        fetch(`/api/guests?invitationId=${encodedId}`, {
          cache: "no-store",
          signal: request.signal,
        }),
      ]);

      const personalData = await personalResponse.json().catch(() => null);
      const guestData = await guestResponse.json().catch(() => null);
      if (request.signal.aborted) return;

      if (!personalResponse.ok) {
        throw new Error(
          personalData?.error ||
            d("Personal Invitation belum dapat dimuat."),
        );
      }

      if (!guestResponse.ok) {
        throw new Error(
          guestData?.error || d("Daftar tamu belum dapat dimuat."),
        );
      }

      setPersonal(
        (personalData?.invitations ?? []) as PersonalInvitationItem[],
      );
      setGuests((guestData?.guests ?? []) as PersonalInvitationGuest[]);
      setDataEventId(eventId);
    } catch (error) {
      if (request.signal.aborted) return;
      setPersonal([]);
      setGuests([]);
      setDataEventId(eventId);
      setNotice(
        error instanceof Error
          ? error.message
          : d("Personal Invitation belum dapat dimuat."),
      );
    } finally {
      if (!request.signal.aborted) setLoading(false);
    }
  }, [d, eventId]);

  useEffect(() => {
    loadEvents().catch(() => undefined);
    return () => eventRequest.current?.abort();
  }, [loadEvents]);

  useEffect(() => {
    setGuestId("");
    setProfile({ ...emptyGuestInvitationForm });
    setEditingId(null);
    setPasswordId(null);
    setPassword("");
    loadCurrent().catch(() => undefined);
    return () => loadRequest.current?.abort();
  }, [eventId, loadCurrent]);

  const currentData = dataEventId === eventId;
  const scopedPersonal = useMemo(() => currentData ? personal : [], [currentData, personal]);
  const scopedGuests = useMemo(() => currentData ? guests : [], [currentData, guests]);
  const personalIds = useMemo(
    () => new Set(scopedPersonal.map((item) => item.id)),
    [scopedPersonal],
  );

  const availableGuests = useMemo(
    () => scopedGuests.filter((item) => !personalIds.has(item.id) && !drafts.some((draft) => draft.guestId === item.id)),
    [scopedGuests, personalIds, drafts],
  );

  const currentDrafts = drafts.filter((draft) => !draft.guestId || draft.invitationId === eventId);

  function selectExistingGuest(id: string) {
    const guest = availableGuests.find((item) => item.id === id);
    if (id && !guest) return;
    setGuestId(id);
    setName("");
    setProfile(guest ? guestInvitationFormFrom(guest) : { ...emptyGuestInvitationForm });
  }

  function changeRecipientName(value: string) {
    stagedInput.current = null;
    if (guestId) {
      setGuestId("");
      setProfile({ ...emptyGuestInvitationForm });
    }
    setName(value);
  }

  function addExisting() {
    const guest = availableGuests.find((item) => item.id === guestId);
    if (!guest || !eventId || creating.current) return;
    if (drafts.length >= 1000) { setNotice(d("Simpan daftar sebelum menambahkan lebih dari 1000 tamu.")); return; }
    setDrafts((current) => current.some((row) => row.guestId === guest.id) ? current : [...current, { key: `guest:${eventId}:${guest.id}`, guestId: guest.id, invitationId: eventId, name: guest.name, category: profile.category, profile: guestInvitationFormFrom(guest) }]);
    setGuestId("");
    setName("");
    setProfile({ ...emptyGuestInvitationForm });
  }

  function addNames() {
    if (guestId || creating.current || stagedInput.current === name) return;
    try {
      const names = splitPersonalGuestNames(name);
      if (drafts.length + names.length > 1000) throw new Error(d("Simpan daftar sebelum menambahkan lebih dari 1000 tamu."));
      const rows = names.map((name) => ({ key: crypto.randomUUID(), name, category: profile.category }));
      stagedInput.current = name;
      setDrafts((current) => [...current, ...rows]);
      setName("");
      setNotice("");
    } catch (error) {
      setNotice(error instanceof Error ? d(error.message) : d("Data tamu tidak valid."));
    }
  }

  function editDraft(key: string, value: { name?: string; category?: string }) {
    if (creating.current) return;
    setDrafts((current) => current.map((row) => row.key === key ? { ...row, ...(!row.guestId && value.name !== undefined ? { name: value.name } : {}), ...(value.category ? { category: value.category } : {}) } : row));
  }

  async function createBatch() {
    if (!selectedEvent || !currentDrafts.length || creating.current) return;
    const rows = currentDrafts.map((row) => ({ ...row, name: row.name.trim() }));
    if (rows.some((row) => !row.name || row.name.length > 120)) {
      setNotice(d("Nama tamu wajib diisi (maksimal 120 karakter)."));
      return;
    }
    creating.current = true;
    setBusyId("create-batch");
    setNotice("");
    let saved = 0;
    let failure = "";
    try {
      for (let index = 0; index < rows.length; index += 100) {
        if (activeEventId.current !== eventId) break;
        const batch = rows.slice(index, index + 100);
        const response = await fetch("/api/personal-invitations", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ invitationId: eventId, published: false, recipients: batch.map((row) => row.guestId ? { guestId: row.guestId, category: row.category } : { key: row.key, name: row.name, category: row.category }) }),
        });
        const data = await response.json().catch(() => null);
        if (!response.ok || !Array.isArray(data?.invitations) || data.invitations.length !== batch.length) {
          throw new Error(data?.error || d("Personal Invitation belum dapat dibuat."));
        }
        const keys = new Set(batch.map((row) => row.key));
        setDrafts((current) => current.filter((row) => !keys.has(row.key)));
        saved += batch.length;
      }
    } catch (error) {
      failure = error instanceof Error ? d(error.message) : d("Personal Invitation belum dapat dibuat.");
    } finally {
      if (activeEventId.current === eventId) {
        await loadCurrent();
        if (activeEventId.current === eventId) setNotice(failure ? `${saved ? `${saved} ${d("tamu tersimpan")}. ` : ""}${failure}` : d("Tautan personal dibuat."));
      }
      creating.current = false;
      setBusyId(null);
    }
  }

  async function publishAll() {
    const ids = scopedPersonal.filter((item) => !item.personalPublished).map((item) => item.id);
    if (!eventId || !ids.length || creating.current || !selectedEvent?.isPublished || !selectedEvent.accessPaid) return;
    creating.current = true;
    setBusyId("publish-batch");
    setNotice("");
    let published = 0;
    let failure = "";
    try {
      for (let index = 0; index < ids.length; index += 100) {
        if (activeEventId.current !== eventId) break;
        const batch = ids.slice(index, index + 100);
        const response = await fetch("/api/personal-invitations", {
          method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ invitationId: eventId, ids: batch, published: true }),
        });
        const data = await response.json().catch(() => null);
        if (!response.ok || data?.count !== batch.length) throw new Error(data?.error || d("Personal Invitation belum dapat diperbarui."));
        published += batch.length;
      }
    } catch (error) {
      failure = error instanceof Error ? d(error.message) : d("Personal Invitation belum dapat diperbarui.");
    } finally {
      if (activeEventId.current === eventId) {
        await loadCurrent();
        if (activeEventId.current === eventId) setNotice(failure ? `${published} ${d("tamu dipublish")}. ${failure}` : d("Semua undangan personal dipublish."));
      }
      creating.current = false;
      setBusyId(null);
    }
  }

  async function copyLink(item: PersonalInvitationItem) {
    if (creating.current || !selectedEvent?.isPublished || !selectedEvent.accessPaid || !item.personalPublished || !scopedPersonal.some((row) => row.id === item.id)) return;
    try {
      await navigator.clipboard.writeText(buildPersonalInvitationPublicUrl(selectedEvent.slug, item.personalToken));
      if (activeEventId.current === eventId) setNotice(d("Tautan disalin."));
    } catch {
      if (activeEventId.current === eventId) setNotice(d("Gagal menyalin tautan. Periksa izin clipboard browser."));
    }
  }

  async function patchPersonalInvitation(
    id: string,
    body: Record<string, unknown>,
    successMessage: string,
  ) {
    if (!eventId || creating.current) return false;

    creating.current = true;
    setBusyId(id);
    setNotice("");

    try {
      const response = await fetch("/api/personal-invitations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId: eventId, id, ...body }),
      });
      const data = await response.json().catch(() => null);
      if (activeEventId.current !== eventId) return false;

      if (!response.ok) {
        throw new Error(
          data?.error || d("Personal Invitation belum dapat diperbarui."),
        );
      }

      setPersonal((current) =>
        current.map((item) =>
          item.id === id
            ? (data.invitation as PersonalInvitationItem)
            : item,
        ),
      );
      await loadCurrent();
      if (activeEventId.current !== eventId) return false;
      setNotice(successMessage);
      return true;
    } catch (error) {
      if (activeEventId.current !== eventId) return false;
      setNotice(
        error instanceof Error
          ? error.message
          : d("Personal Invitation belum dapat diperbarui."),
      );
      return false;
    } finally {
      creating.current = false;
      setBusyId(null);
    }
  }

  function startEdit(item: PersonalInvitationItem) {
    setEditingId(item.id);
    setEditName(item.name);
    setEditPhone(item.phone || "");
    setEditProfile(guestInvitationFormFrom(item));
  }

  async function saveEdit(item: PersonalInvitationItem) {
    if (!editName.trim()) return;

    const ok = await patchPersonalInvitation(
      item.id,
      { name: editName.trim(), phone: editPhone.trim(), category: editProfile.category },
      d("Data tamu diperbarui."),
    );

    if (ok) setEditingId(null);
  }

  async function savePassword(item: PersonalInvitationItem) {
    if (password.trim().length < 6) {
      setNotice(d("Password minimal 6 karakter."));
      return;
    }

    const ok = await patchPersonalInvitation(
      item.id,
      { passwordProtected: true, password: password.trim() },
      d("Password Personal Invitation diperbarui."),
    );

    if (ok) {
      setPasswordId(null);
      setPassword("");
    }
  }

  async function disablePassword(item: PersonalInvitationItem) {
    const ok = await patchPersonalInvitation(
      item.id,
      { passwordProtected: false },
      d("Password Personal Invitation dimatikan."),
    );

    if (ok) {
      setPasswordId(null);
      setPassword("");
    }
  }

  const publishedCount = scopedPersonal.filter(
    (item) => item.personalPublished,
  ).length;
  const totalViews = scopedPersonal.reduce(
    (sum, item) => sum + (item.personalViewCount || 0),
    0,
  );

  return (
    <DashboardPage>
      <DashboardPageHeader title={d("Undangan Personal")} />
      {notice && <DashboardNotice className="mt-4">{notice}</DashboardNotice>}

      <div className="mt-5">
        <PersonalInvitationCreatePanel
          selectedEvent={selectedEvent}
          availableGuests={availableGuests}
          guestId={currentData ? guestId : ""}
          setGuestId={selectExistingGuest}
          name={currentData && guestId ? availableGuests.find((guest) => guest.id === guestId)?.name ?? "" : name}
          setName={changeRecipientName}
          profile={profile}
          setProfile={setProfile}
          loading={loading || !currentData}
          busyId={busyId}
          drafts={currentDrafts}
          onAddExisting={addExisting}
          onAddNames={addNames}
          onRemoveDraft={(key) => { if (!creating.current) setDrafts((current) => current.filter((row) => row.key !== key)); }}
          onEditDraft={editDraft}
        />
      </div>

      <section className="mt-5 space-y-4" aria-label={d("Pilih undangan")}>
        {eventsLoading ? <p className="text-sm text-muted-foreground">{d("Memuat...")}</p> : savedEvents.length ? (
        <EventScopePicker
          label={d("Pilih undangan")}
          events={savedEvents}
          value={eventId}
          onChange={(id) => { setEventId(id); onSelectEvent(id); }}
          disabled={eventsLoading || Boolean(busyId)}
        />
        ) : <DashboardEmptyState title={d("Belum ada undangan tersimpan")} description={d("Simpan desain di Edit undangan terlebih dahulu.")} />}
        <div className="flex flex-wrap gap-2">
          <Button type="button" disabled={!selectedEvent || !currentDrafts.length || Boolean(busyId)} onClick={createBatch}>
            {busyId === "create-batch" ? d("Menyimpan...") : d("Buat tautan personal")}
          </Button>
          {designEvent && <Button asChild variant="outline"><Link href={`/dashboard/editor?invitationId=${encodeURIComponent(designEvent.id)}`}>{d("Edit undangan")}</Link></Button>}
        </div>
        {selectedEvent && (!selectedEvent.isPublished || !selectedEvent.accessPaid) && <p className="text-sm text-muted-foreground">{d(!selectedEvent.isPublished ? "Terbitkan undangan acara untuk Publish personal." : "Aktifkan akses Undangan Digital sebelum publish.")}</p>}
      </section>

      {selectedEvent && (
        <>
          <DashboardMetricGrid className="mt-5 xl:grid-cols-3">
            <DashboardMetricCard icon={ContactRound} label={d("Total")} value={String(scopedPersonal.length)} />
            <DashboardMetricCard icon={Send} label={d("Publish")} value={String(publishedCount)} />
            <DashboardMetricCard icon={Eye} label={d("Dibuka")} value={String(totalViews)} />
          </DashboardMetricGrid>
          <div className="mt-5">
            <PersonalInvitationListPanel
              selectedEvent={selectedEvent}
              personal={scopedPersonal}
              editingId={editingId}
              editName={editName}
              setEditName={setEditName}
              editPhone={editPhone}
              setEditPhone={setEditPhone}
              editProfile={editProfile}
              setEditProfile={setEditProfile}
              passwordId={passwordId}
              setPasswordId={setPasswordId}
              password={password}
              setPassword={setPassword}
              busyId={busyId}
              loading={loading}
              onReload={() => void loadCurrent()}
              onStartEdit={startEdit}
              onSaveEdit={(item) => void saveEdit(item)}
              onPatch={patchPersonalInvitation}
              onSavePassword={(item) => void savePassword(item)}
              onDisablePassword={(item) => void disablePassword(item)}
              onPublishAll={publishAll}
              onCopyLink={copyLink}
            />
          </div>
        </>
      )}
    </DashboardPage>
  );
}
