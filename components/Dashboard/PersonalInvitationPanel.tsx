"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ContactRound, Eye, Send } from "lucide-react";
import EventScopePicker from "@/components/Dashboard/EventScopePicker";
import { useDashboardI18n } from "@/components/Dashboard/useDashboardI18n";
import {
  DashboardMetricCard,
  DashboardMetricGrid,
  DashboardNotice,
  DashboardPage,
  DashboardPageHeader,
} from "@/components/Dashboard/DashboardPrimitives";
import {
  PersonalInvitationCreatePanel,
  PersonalInvitationListPanel,
} from "@/components/Dashboard/PersonalInvitationPanels";
import { sortPersonalInvitationEvents } from "@/components/Dashboard/personal-invitation-helpers";
import {
  emptyGuestInvitationForm,
  guestInvitationFormFrom,
  guestInvitationProfilePayload,
  type GuestInvitationForm,
} from "@/components/Dashboard/PersonalInvitationGuestFields";
import type {
  PersonalInvitationEvent,
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
  const creating = useRef(false);
  const [guestId, setGuestId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
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

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === eventId) ?? null,
    [events, eventId],
  );

  useEffect(() => { activeEventId.current = eventId; }, [eventId]);

  const loadEvents = useCallback(async () => {
    setEventsLoading(true);
    setNotice("");

    try {
      const response = await fetch("/api/invitations?all=1", {
        cache: "no-store",
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || d("Daftar acara belum dapat dimuat."));
      }

      const configured = sortPersonalInvitationEvents(
        ((data?.invitations ?? []) as PersonalInvitationEvent[]).filter(
          (invitation) => invitation.eventConfigured,
        ),
      );

      setEvents(configured);
      setEventId((current) => {
        if (selectedEventId && configured.some((event) => event.id === selectedEventId)) {
          return selectedEventId;
        }
        if (configured.some((event) => event.id === current)) return current;
        return configured.find((event) => event.accessPaid)?.id ?? configured[0]?.id ?? "";
      });
    } catch (error) {
      setEvents([]);
      setEventId("");
      setNotice(
        error instanceof Error
          ? error.message
          : d("Daftar acara belum dapat dimuat."),
      );
    } finally {
      setEventsLoading(false);
    }
  }, [d, selectedEventId]);

  useEffect(() => {
    if (selectedEventId && events.some((event) => event.id === selectedEventId)) {
      setEventId(selectedEventId);
    }
  }, [selectedEventId, events]);

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
  }, [loadEvents]);

  useEffect(() => {
    setGuestId("");
    setName("");
    setPhone("");
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
    () => scopedGuests.filter((item) => !personalIds.has(item.id)),
    [scopedGuests, personalIds],
  );

  function selectExistingGuest(id: string) {
    const guest = availableGuests.find((item) => item.id === id);
    if (id && !guest) return;
    setGuestId(id);
    setName(guest?.name ?? "");
    setPhone(guest?.phone ?? "");
    setProfile(guest ? guestInvitationFormFrom(guest) : { ...emptyGuestInvitationForm });
  }

  function changeRecipientName(value: string) {
    if (guestId) {
      setGuestId("");
      setPhone("");
      setProfile({ ...emptyGuestInvitationForm });
    }
    setName(value);
  }

  async function createFromExisting() {
    if (!eventId || !guestId || creating.current || !availableGuests.some((guest) => guest.id === guestId)) return;

    creating.current = true;
    setBusyId("create-existing");
    setNotice("");

    try {
      const response = await fetch("/api/personal-invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invitationId: eventId,
          guestId,
          category: profile.category,
        }),
      });
      const data = await response.json().catch(() => null);
      if (activeEventId.current !== eventId) return;

      if (!response.ok) {
        throw new Error(
          data?.error || d("Personal Invitation belum dapat dibuat."),
        );
      }

      setGuestId("");
      setName("");
      setPhone("");
      setProfile({ ...emptyGuestInvitationForm });
      await loadCurrent();
      if (activeEventId.current === eventId) setNotice(d("Undangan personal dibuat."));
    } catch (error) {
      if (activeEventId.current !== eventId) return;
      setNotice(
        error instanceof Error
          ? error.message
          : d("Personal Invitation belum dapat dibuat."),
      );
    } finally {
      creating.current = false;
      setBusyId(null);
    }
  }

  async function createNew() {
    if (!eventId || !name.trim() || creating.current || guestId) return;

    creating.current = true;
    setBusyId("create-new");
    setNotice("");

    try {
      const response = await fetch("/api/personal-invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invitationId: eventId,
          name: name.trim(),
          phone: phone.trim(),
          ...guestInvitationProfilePayload(profile),
        }),
      });
      const data = await response.json().catch(() => null);
      if (activeEventId.current !== eventId) return;

      if (!response.ok) {
        throw new Error(
          data?.error || d("Personal Invitation belum dapat dibuat."),
        );
      }

      setName("");
      setPhone("");
      setProfile({ ...emptyGuestInvitationForm });
      await loadCurrent();
      if (activeEventId.current === eventId) setNotice(d("Undangan personal dibuat."));
    } catch (error) {
      if (activeEventId.current !== eventId) return;
      setNotice(
        error instanceof Error
          ? error.message
          : d("Personal Invitation belum dapat dibuat."),
      );
    } finally {
      creating.current = false;
      setBusyId(null);
    }
  }

  async function patchPersonalInvitation(
    id: string,
    body: Record<string, unknown>,
    successMessage: string,
  ) {
    if (!eventId) return false;

    setBusyId(id);
    setNotice("");

    try {
      const response = await fetch("/api/personal-invitations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId: eventId, id, ...body }),
      });
      const data = await response.json().catch(() => null);

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
      setNotice(successMessage);
      return true;
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : d("Personal Invitation belum dapat diperbarui."),
      );
      return false;
    } finally {
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
      <DashboardPageHeader
        title={d("Undangan Personal")}
      >
        <EventScopePicker
          label={d("Pilih undangan")}
          events={events}
          value={eventId}
          onChange={(id) => { setEventId(id); onSelectEvent(id); }}
          disabled={eventsLoading || Boolean(busyId)}
        />
      </DashboardPageHeader>

      {notice && <DashboardNotice className="mt-4">{notice}</DashboardNotice>}

      {!events.length ? null : selectedEvent ? (
        <>
          <DashboardMetricGrid className="mt-4 xl:grid-cols-3">
            <DashboardMetricCard
              icon={ContactRound}
              label={d("Total")}
              value={String(scopedPersonal.length)}
            />
            <DashboardMetricCard
              icon={Send}
              label={d("Publish")}
              value={String(publishedCount)}
            />
            <DashboardMetricCard
              icon={Eye}
              label={d("Dibuka")}
              value={String(totalViews)}
            />
          </DashboardMetricGrid>

          <div className="mt-5 grid gap-4 2xl:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.7fr)]">
            <PersonalInvitationCreatePanel
              key={eventId}
              selectedEvent={selectedEvent}
              availableGuests={availableGuests}
              guestId={currentData ? guestId : ""}
              setGuestId={selectExistingGuest}
              name={currentData ? name : ""}
              setName={changeRecipientName}
              profile={currentData ? profile : { ...emptyGuestInvitationForm }}
              setProfile={setProfile}
              loading={loading || !currentData}
              busyId={busyId}
              onCreateExisting={createFromExisting}
              onCreateNew={createNew}
            />

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
            />
          </div>
        </>
      ) : null}
    </DashboardPage>
  );
}
