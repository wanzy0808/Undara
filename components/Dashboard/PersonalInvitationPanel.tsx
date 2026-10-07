"use client";

import { weddingSessionsFor, parseInvitedSessions, type WeddingSessionId } from "@/lib/events/wedding-sessions";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import EventScopePicker from "@/components/Dashboard/EventScopePicker";
import { Button } from "@/components/ui/button";
import { useDashboardI18n } from "@/components/Dashboard/useDashboardI18n";
import {
  DashboardEmptyState,
  DashboardNotice,
  DashboardPage,
} from "@/components/Dashboard/DashboardPrimitives";
import {
  PersonalInvitationCreatePanel,
  PersonalInvitationListPanel,
} from "@/components/Dashboard/PersonalInvitationPanels";
import { buildPersonalInvitationPublicUrl, sortPersonalInvitationEvents, splitPersonalGuestNames } from "@/components/Dashboard/personal-invitation-helpers";
import { buildPersonalGuestAddressee, getPersonalGuestSalutation, type PersonalSalutation } from "@/lib/guests/personal-envelope";
import { MAX_GUEST_PARTY_SIZE, minimumInvitedPaxForSalutation } from "@/lib/guests/manual-party";
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
  const [salutation, setSalutation] = useState<PersonalSalutation>("BAPAK");
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
    let invitedSessions: WeddingSessionId[];
    try {
      const sessions = weddingSessionsFor(selectedEvent ?? {});
      invitedSessions = parseInvitedSessions(sessions.length === 1 ? [sessions[0].id] : profile.invitedSessions, sessions);
    } catch (error) {
      setNotice(error instanceof Error ? d(error.message) : d("Data tamu tidak valid."));
      return;
    }
    setDrafts((current) => current.some((row) => row.guestId === guest.id) ? current : [...current, { key: `guest:${eventId}:${guest.id}`, guestId: guest.id, invitationId: eventId, name: guest.name, category: profile.category, profile: { ...profile }, ...(weddingSessionsFor(selectedEvent ?? {}).length ? { invitedSessions } : {}) }]);
    setGuestId("");
    setName("");
    setProfile({ ...emptyGuestInvitationForm });
  }

  function addNames() {
    if (guestId || creating.current || stagedInput.current === name) return;
    try {
      const names = splitPersonalGuestNames(name);
      if (names.some((name) => !buildPersonalGuestAddressee(name, salutation))) throw new Error(d("Nama tamu wajib diisi (maksimal 120 karakter)."));
      if (drafts.length + names.length > 1000) throw new Error(d("Simpan daftar sebelum menambahkan lebih dari 1000 tamu."));
      const minimum = minimumInvitedPaxForSalutation(salutation);
      if (!Number.isInteger(profile.invitedPax) || profile.invitedPax < minimum || profile.invitedPax > MAX_GUEST_PARTY_SIZE) {
        throw new Error(d("Jumlah tamu wajib 1–30 orang."));
      }
      const sessions = weddingSessionsFor(selectedEvent ?? {});
      const invitedSessions = parseInvitedSessions(sessions.length === 1 ? [sessions[0].id] : profile.invitedSessions, sessions);
      const rows = names.map((name) => ({ key: crypto.randomUUID(), name, category: profile.category, salutation, invitedPax: profile.invitedPax, ...(sessions.length ? { invitedSessions } : {}) }));
      stagedInput.current = name;
      setDrafts((current) => [...current, ...rows]);
      setName("");
      setNotice("");
    } catch (error) {
      setNotice(error instanceof Error ? d(error.message) : d("Data tamu tidak valid."));
    }
  }

  function editDraft(key: string, value: { name?: string; category?: string; salutation?: PersonalSalutation; invitedPax?: number; invitedSessions?: WeddingSessionId[] }) {
    if (creating.current) return;
    setDrafts((current) => current.map((row) => {
      if (row.key !== key) return row;
      if (row.guestId) return { ...row, ...value };
      const nextSalutation = value.salutation ?? row.salutation ?? "BAPAK";
      const minimum = minimumInvitedPaxForSalutation(nextSalutation);
      const currentPax = value.invitedPax ?? row.invitedPax ?? 1;
      return {
        ...row,
        ...(value.invitedSessions !== undefined ? { invitedSessions: value.invitedSessions } : {}),
        ...(value.name !== undefined ? { name: value.name } : {}),
        ...(value.salutation ? { salutation: value.salutation } : {}),
        ...(value.category ? { category: value.category } : {}),
        invitedPax: Math.max(minimum, Math.min(MAX_GUEST_PARTY_SIZE, currentPax)),
      };
    }));
  }

  async function createBatch() {
    if (!selectedEvent || !currentDrafts.length || creating.current) return;
    const rows = currentDrafts.map((row) => ({ ...row, name: row.name.trim() }));
    if (rows.some((row) => !row.name || row.name.length > 120 || (!row.guestId && (!buildPersonalGuestAddressee(row.name, row.salutation ?? "BAPAK") || !Number.isInteger(row.invitedPax) || (row.invitedPax ?? 0) < minimumInvitedPaxForSalutation(row.salutation ?? "BAPAK") || (row.invitedPax ?? 0) > MAX_GUEST_PARTY_SIZE)))) {
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
          body: JSON.stringify({ invitationId: eventId, published: false, recipients: batch.map((row) => row.guestId ? { guestId: row.guestId, category: row.category, invitedSessions: row.invitedSessions } : { key: row.key, name: row.name, category: row.category, invitedSessions: row.invitedSessions, salutation: row.salutation ?? "BAPAK", invitedPax: row.invitedPax ?? minimumInvitedPaxForSalutation(row.salutation ?? "BAPAK") }) }),
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

  async function publishIds(
    ids: string[],
    busyKey: "publish-batch" | "publish-selected",
    successMessage: string,
  ) {
    const available = new Set(
      scopedPersonal.filter((item) => !item.personalPublished).map((item) => item.id),
    );
    const uniqueIds = Array.from(new Set(ids)).filter((id) => available.has(id));
    if (
      !eventId ||
      !uniqueIds.length ||
      creating.current ||
      !selectedEvent?.isPublished ||
      !selectedEvent.accessPaid
    ) return;

    creating.current = true;
    setBusyId(busyKey);
    setNotice("");
    let published = 0;
    let failure = "";
    try {
      for (let index = 0; index < uniqueIds.length; index += 100) {
        if (activeEventId.current !== eventId) break;
        const batch = uniqueIds.slice(index, index + 100);
        const response = await fetch("/api/personal-invitations", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ invitationId: eventId, ids: batch, published: true }),
        });
        const data = await response.json().catch(() => null);
        if (!response.ok || data?.count !== batch.length) {
          throw new Error(
            data?.error || d("Personal Invitation belum dapat diperbarui."),
          );
        }
        published += batch.length;
      }
    } catch (error) {
      failure =
        error instanceof Error
          ? d(error.message)
          : d("Personal Invitation belum dapat diperbarui.");
    } finally {
      if (activeEventId.current === eventId) {
        await loadCurrent();
        if (activeEventId.current === eventId) {
          setNotice(
            failure
              ? `${published} ${d("tamu dipublish")}. ${failure}`
              : successMessage,
          );
        }
      }
      creating.current = false;
      setBusyId(null);
    }
  }

  async function publishAll() {
    await publishIds(
      scopedPersonal.filter((item) => !item.personalPublished).map((item) => item.id),
      "publish-batch",
      d("Semua undangan personal dipublish."),
    );
  }

  async function publishSelected(ids: string[]) {
    await publishIds(
      ids,
      "publish-selected",
      d("Undangan terpilih dipublish."),
    );
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
    const salutation = getPersonalGuestSalutation(item);
    const personalAddressee = salutation ? buildPersonalGuestAddressee(editName, salutation) : undefined;
    if (salutation && !personalAddressee) { setNotice(d("Nama tamu wajib diisi (maksimal 120 karakter).")); return; }

    const ok = await patchPersonalInvitation(
      item.id,
      { name: editName.trim(), phone: editPhone.trim(), category: editProfile.category,
        ...(!item.checkedIn && weddingSessionsFor(selectedEvent ?? {}).length ? { invitedSessions: weddingSessionsFor(selectedEvent ?? {}).length === 1 ? [weddingSessionsFor(selectedEvent ?? {})[0].id] : editProfile.invitedSessions } : {}),
        ...(personalAddressee && personalAddressee !== item.personalAddressee ? { personalAddressee } : {}),
      },
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

  return (
    <DashboardPage>
      {notice && <DashboardNotice>{notice}</DashboardNotice>}

      <div className={notice ? "mt-4" : ""}>
        <PersonalInvitationCreatePanel
          selectedEvent={selectedEvent}
          availableGuests={availableGuests}
          guestId={currentData ? guestId : ""}
          setGuestId={selectExistingGuest}
          name={currentData && guestId ? availableGuests.find((guest) => guest.id === guestId)?.name ?? "" : name}
          setName={changeRecipientName}
          salutation={salutation}
          setSalutation={setSalutation}
          profile={profile}
          setProfile={setProfile}
          loading={loading || !currentData}
          busyId={busyId}
          drafts={currentDrafts}
          onAddExisting={addExisting}
          onAddNames={addNames}
          onRemoveDraft={(key) => {
            if (!creating.current) {
              setDrafts((current) => current.filter((row) => row.key !== key));
            }
          }}
          onEditDraft={editDraft}
        />
      </div>

      <section
        className="mt-4 border-y border-primary/15 py-4"
        aria-label={d("Pilih undangan")}
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="w-full max-w-sm">
            {eventsLoading ? (
              <p className="text-sm text-muted-foreground">{d("Memuat...")}</p>
            ) : savedEvents.length ? (
              <EventScopePicker
                label={d("Pilih undangan")}
                events={savedEvents}
                value={eventId}
                onChange={(id) => {
                  setEventId(id);
                  onSelectEvent(id);
                }}
                disabled={eventsLoading || Boolean(busyId)}
              />
            ) : (
              <DashboardEmptyState
                title={d("Belum ada undangan tersimpan")}
                description={d("Simpan desain di Edit undangan terlebih dahulu.")}
              />
            )}
          </div>
          <Button
            type="button"
            className="w-full md:w-auto"
            disabled={!selectedEvent || !currentDrafts.length || Boolean(busyId)}
            onClick={createBatch}
          >
            {busyId === "create-batch" ? d("Menyimpan...") : d("Buat tautan personal")}
          </Button>
        </div>
        {selectedEvent && (!selectedEvent.isPublished || !selectedEvent.accessPaid) && (
          <p className="mt-2 text-sm text-muted-foreground">
            {d(
              !selectedEvent.isPublished
                ? "Terbitkan undangan acara untuk Publish personal."
                : "Aktifkan akses Undangan Digital sebelum publish.",
            )}
          </p>
        )}
      </section>

      {selectedEvent && (
        <div className="mt-4">
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
            onPublishSelected={publishSelected}
            onCopyLink={copyLink}
          />
        </div>
      )}
    </DashboardPage>
  );
}
