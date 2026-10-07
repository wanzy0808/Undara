"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  LogOut,
  KeyRound,
  UserRound,
  Menu,
  Receipt,
  Settings2,
  X,
} from "lucide-react";
import ThemeToggle from "@/components/Theme/ThemeToggle";
import LanguageToggle from "@/components/I18n/LanguageToggle";
import { useDashboardI18n } from "@/components/Dashboard/useDashboardI18n";
import FeatureGate from "@/components/Dashboard/FeatureGate";
import InvitationWorkspacePanel from "@/components/Dashboard/InvitationWorkspacePanel";
import EventPanelEditor from "@/components/Dashboard/EventPanel";
import { isSelectableTemplate, readTemplateSelection, rememberTemplateSelection } from "@/lib/templates/template-intent";
import { displayTitleCase } from "@/lib/text/display-title-case";
import WhatsAppBlastPanel from "@/components/Dashboard/WhatsAppBlastPanel";
import PersonalInvitationPanel from "@/components/Dashboard/PersonalInvitationPanel";
import { Button } from "@/components/ui/button";
import BrandWordmark from "@/components/Brand/BrandWordmark";
import {
  DashboardField,
  DashboardMenuItem,
} from "@/components/Dashboard/DashboardControls";
import {
  PlacementWorkspace,
  RsvpWorkspace,
  UsherPanel,
  WorkspaceOverview,
} from "@/components/Dashboard/DashboardWorkspaces";
import { dashboardHrefForTab, dashboardTabFromSearch, dashboardTabMeta, guestManagementTabs, invitationTabs } from "@/components/Dashboard/dashboard-navigation";
import DashboardSidebar from "@/components/Dashboard/DashboardSidebar";
import DashboardAccountPanel from "@/components/Dashboard/DashboardAccountPanel";
import DashboardWhatsAppHelp from "@/components/Dashboard/DashboardWhatsAppHelp";
import {
  fetchEventGuestData,
  sortDashboardEvents,
} from "@/components/Dashboard/dashboard-client";
import type {
  DashboardContext,
  DashboardEvent,
  DashboardGuest,
  DashboardTable,
  DashboardTab,
} from "@/components/Dashboard/dashboard-types";

export default function DashboardPage() {
  const router = useRouter();
  const { d } = useDashboardI18n();
  const [tab, setTab] = useState<DashboardTab>("overview");
  const [pendingTemplate, setPendingTemplate] = useState<string | null>(null);
  const [invitationMenuOpen, setInvitationMenuOpen] = useState(true);
  const [guestMenuOpen, setGuestMenuOpen] = useState(false);
  const [ctx, setCtx] = useState<DashboardContext | null>(null);
  const [events, setEvents] = useState<DashboardEvent[]>([]);
  const [activeEventId, setActiveEventId] = useState("");
  const [rsvpEventId, setRsvpEventId] = useState("");
  const [rsvpGuests, setRsvpGuests] = useState<DashboardGuest[]>([]);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [placementEventId, setPlacementEventId] = useState("");
  const [placementGuests, setPlacementGuests] = useState<DashboardGuest[]>([]);
  const [placementTables, setPlacementTables] = useState<DashboardTable[]>([]);
  const [placementLoading, setPlacementLoading] = useState(false);
  const [usherEventId, setUsherEventId] = useState("");
  const [usherGuests, setUsherGuests] = useState<DashboardGuest[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileMenu, setProfileMenu] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const contentScrollRef = useRef<HTMLElement>(null);
  const [profileSection, setProfileSection] = useState<"profile" | "security">("profile");
  const [onboarding, setOnboarding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [onboardingError, setOnboardingError] = useState("");
  const [nickname, setNickname] = useState("");

  const load = async () => {
    const [contextResponse, invitationResponse] = await Promise.all([
      fetch("/api/dashboard/context", { cache: "no-store" }),
      fetch("/api/invitations?all=1", { cache: "no-store" }),
    ]);

    if (contextResponse.ok) {
      const next = (await contextResponse.json()) as DashboardContext;
      setCtx(next);
      setNickname(next.profile.displayName || "");
      setOnboarding(!next.profile.displayName?.trim());
    }

    if (invitationResponse.ok) {
      const data = await invitationResponse.json();
      const configured = sortDashboardEvents(
        ((data.invitations ?? []) as DashboardEvent[]).filter(
          (invitation) => invitation.eventConfigured,
        ),
      );
      setEvents(configured);
      const firstId = configured.find((event) => event.accessPaid)?.id ?? configured[0]?.id ?? "";
      setActiveEventId((current) => configured.some((event) => event.id === current) ? current : firstId);
      setRsvpEventId((current) =>
        configured.some((event) => event.id === current) ? current : firstId,
      );
      setPlacementEventId((current) =>
        configured.some((event) => event.id === current) ? current : firstId,
      );

      setUsherEventId((current) =>
        configured.some((event) => event.id === current)
          ? current
          : configured.find((event) => event.accessPaid)?.id ?? firstId,
      );
    }
  };

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  useEffect(() => {
    const syncTabFromLocation = () => {
      if (window.location.pathname !== "/dashboard") return;
      const nextTab = dashboardTabFromSearch(window.location.search);
      setTab(nextTab);
      if (invitationTabs.has(nextTab)) setInvitationMenuOpen(true);
      if (guestManagementTabs.has(nextTab)) setGuestMenuOpen(true);
      setMobileOpen(false);
      setProfileMenu(false);
      if (contentScrollRef.current) contentScrollRef.current.scrollTop = 0;
    };

    syncTabFromLocation();
    window.addEventListener("popstate", syncTabFromLocation);

    const params = new URLSearchParams(window.location.search);
    // Only resume a locally saved theme during an explicit catalog->event flow:
    // browsing the Dashboard normally must not overwrite another event's design.
    if (params.get("from") === "template") {
      const requested = params.get("template");
      const selected = isSelectableTemplate(requested) ? requested : readTemplateSelection();
      if (selected) {
        setPendingTemplate(selected);
        rememberTemplateSelection(selected);
      }
    }

    return () => window.removeEventListener("popstate", syncTabFromLocation);
  }, []);

  useEffect(() => {
    // Refresh the shared Guest records whenever this workspace is opened again.
    if (tab !== "rsvp") return;
    let active = true;
    if (!rsvpEventId) {
      setRsvpGuests([]);
      setRsvpLoading(false);
      return () => {
        active = false;
      };
    }

    let pending = false;
    async function refresh(initial = false) {
      if (pending || (!initial && document.visibilityState !== "visible")) return;
      pending = true;
      if (initial) setRsvpLoading(true);
      try {
        const data = await fetchEventGuestData(rsvpEventId, d("Data acara belum dapat dimuat."));
        if (active) setRsvpGuests(data.guests);
      } catch {
        // Retain the last successful snapshot on a transient polling failure.
        if (active && initial) setRsvpGuests([]);
      } finally {
        pending = false;
        if (active && initial) setRsvpLoading(false);
      }
    }
    void refresh(true);
    const onVisible = () => { void refresh(); };
    const timer = window.setInterval(onVisible, 10_000);
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [rsvpEventId, tab]);

  useEffect(() => {
    if (tab !== "placement") return;
    let active = true;
    if (!placementEventId) {
      setPlacementGuests([]);
      setPlacementTables([]);
      setPlacementLoading(false);
      return () => {
        active = false;
      };
    }

    setPlacementLoading(true);
    fetchEventGuestData(placementEventId, d("Data acara belum dapat dimuat."))
      .then((data) => {
        if (!active) return;
        setPlacementGuests(data.guests);
        setPlacementTables(data.tables);
      })
      .catch(() => {
        if (!active) return;
        setPlacementGuests([]);
        setPlacementTables([]);
      })
      .finally(() => {
        if (active) setPlacementLoading(false);
      });

    return () => {
      active = false;
    };
  }, [placementEventId, tab]);

  useEffect(() => {
    if (tab !== "usher") return;
    let active = true;
    if (!usherEventId) {
      setUsherGuests([]);
      return;
    }
    fetchEventGuestData(usherEventId, d("Data acara belum dapat dimuat."))
      .then((data) => { if (active) setUsherGuests(data.guests); })
      .catch(() => { if (active) setUsherGuests([]); });
    return () => { active = false; };
  }, [tab, usherEventId]);

  useEffect(() => {
    if (tab !== "overview") return;
    let active = true;
    fetch("/api/dashboard/context", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return;
        const next = (await response.json()) as DashboardContext;
        if (active) setCtx(next);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [tab]);

  useEffect(() => {
    if (!profileMenu) return;
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !accountMenuRef.current?.contains(event.target)) {
        setProfileMenu(false);
      }
    };
    const closeEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setProfileMenu(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeEscape);
    };
  }, [profileMenu]);

  const canGuestbook = ctx?.entitlements.hasGuestbook ?? false;
  const accent = "text-primary";

  const savedProfileName = ctx?.profile.displayName?.trim();
  const profileLabel =
    savedProfileName && savedProfileName.toLowerCase() !== "dashboard"
      ? savedProfileName
      : ctx?.profile.email?.split("@")[0] || "Akun";
  const rsvpEvent = events.find((event) => event.id === rsvpEventId) ?? null;
  const placementEvent =
    events.find((event) => event.id === placementEventId) ?? null;

  async function refreshRsvp() {
    if (!rsvpEventId) return;
    const data = await fetchEventGuestData(rsvpEventId, d("Data acara belum dapat dimuat."));
    setRsvpGuests(data.guests);
  }

  async function refreshPlacement() {
    if (!placementEventId) return;
    const data = await fetchEventGuestData(placementEventId, d("Data acara belum dapat dimuat."));
    setPlacementGuests(data.guests);
    setPlacementTables(data.tables);
  }

  async function refreshUsher() {
    if (!usherEventId) return;
    const data = await fetchEventGuestData(usherEventId, d("Data acara belum dapat dimuat."));
    setUsherGuests(data.guests);
  }

  async function saveOnboarding() {
    const displayName = nickname.trim();
    if (!displayName) {
      setOnboardingError(d("Nama panggilan wajib diisi."));
      return;
    }

    setSaving(true);
    setOnboardingError("");
    try {
      const profileResponse = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ firstName: displayName }),
      });
      if (!profileResponse.ok) {
        const data = await profileResponse.json().catch(() => null);
        throw new Error(data?.error || d("Nama panggilan belum tersimpan."));
      }

      setOnboarding(false);
      setCtx((current) =>
        current
          ? {
              ...current,
              profile: { ...current.profile, displayName },
            }
          : current,
      );
      setNickname(displayName);
      await load();
    } catch (error) {
      setOnboardingError(
        error instanceof Error ? error.message : d("Data belum tersimpan. Coba lagi."),
      );
      setOnboarding(true);
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  function selectEvent(id: string) {
    setActiveEventId(id);
    setRsvpEventId(id);
    setPlacementEventId(id);
    setUsherEventId(id);
  }

  function go(id: DashboardTab) {
    if (contentScrollRef.current) contentScrollRef.current.scrollTop = 0;
    setTab(id);
    if (invitationTabs.has(id)) setInvitationMenuOpen(true);
    if (guestManagementTabs.has(id)) setGuestMenuOpen(true);
    setMobileOpen(false);
    setProfileMenu(false);

    const href = dashboardHrefForTab(id, window.location.search);
    const currentHref = `${window.location.pathname}${window.location.search}`;
    if (href !== currentHref) window.history.pushState(null, "", href);
  }

  const meta = dashboardTabMeta[tab];
  const scopedHeaderEvent = tab === "rsvp" ? rsvpEvent : null;

  return (
    <div
      className="undara-dashboard undara-dashboard--redesign relative isolate flex h-dvh min-h-0 w-full flex-col overflow-hidden font-[family-name:var(--font-undara-sans)] text-foreground"
    >
      <div className="undara-dashboard-frame relative flex h-[90dvh] min-h-0 w-[90vw] overflow-hidden">
        <DashboardSidebar
          tab={tab}
          onNavigate={go}
          invitationMenuOpen={invitationMenuOpen}
          onToggleInvitationMenu={() => setInvitationMenuOpen((value) => !value)}
          guestMenuOpen={guestMenuOpen}
          onToggleGuestMenu={() => setGuestMenuOpen((value) => !value)}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
        />

        <div className="undara-dashboard-workspace flex min-h-0 min-w-0 flex-1 flex-col">
          <header className="undara-dashboard-header sticky top-0 z-40 border-b border-border/70 bg-background/95 backdrop-blur-xl">
            <div className="flex min-h-16 w-full min-w-0 items-stretch">
              <div className="undara-dashboard-brand hidden w-64 shrink-0 items-center border-r border-border/70 px-5 lg:flex">
                <Link href="/" className="group block min-w-0">
                  <BrandWordmark
                    size="dashboard"
                    className="transition-transform group-hover:scale-[1.01]"
                  />
                </Link>
              </div>

              <div className="min-w-0 flex-1">
                <div className="undara-dashboard-header-inner mx-auto flex min-h-16 w-[80vw] max-w-[calc(100%-2rem)] min-w-0 items-center gap-3">
                  <Button
                    type="button"
                    size="icon"
                    className="h-11 w-11 border-primary/35 bg-transparent text-primary shadow-none hover:border-primary hover:bg-primary/5 hover:text-primary lg:hidden"
                    onClick={() => setMobileOpen((value) => !value)}
                    aria-label={mobileOpen ? d("Tutup menu dashboard") : d("Buka menu dashboard")}
                    aria-expanded={mobileOpen}
                    aria-controls="undara-dashboard-sidebar"
                    title={d("Buka menu dashboard")}
                  >
                    {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                  </Button>

                  <Link href="/" className="group min-w-0 shrink-0 lg:hidden">
                    <BrandWordmark size="mobile" />
                  </Link>

                  <div className="hidden h-8 w-px bg-border/70 sm:block lg:hidden" />

                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <h1 className="undara-dashboard-header-title truncate text-base font-semibold text-foreground sm:text-lg">
                        {d(meta.title)}
                      </h1>
                      {scopedHeaderEvent && (
                        <span className="hidden max-w-56 truncate border-l border-border pl-2 text-[13px] text-muted-foreground xl:inline">
                          {displayTitleCase(scopedHeaderEvent.title)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="undara-dashboard-header-controls ml-auto hidden items-center gap-1 sm:flex">
                    <ThemeToggle />
                    <LanguageToggle />
                  </div>

                  <div ref={accountMenuRef} className="undara-dashboard-account relative">
                    <Button
                      type="button"
                      onClick={() => setProfileMenu((value) => !value)}
                      className="undara-dashboard-account-button h-11 min-w-0 border-primary/35 bg-transparent px-2 text-primary shadow-none hover:border-primary hover:bg-primary/5 hover:text-primary dark:border-white/20 dark:text-white dark:hover:border-white/35 dark:hover:bg-white/[0.07] dark:hover:text-white"
                      aria-label={`${d("Menu akun")}: ${profileLabel}`}
                      aria-expanded={profileMenu}
                      aria-haspopup="true"
                      title={d("Menu akun")}
                    >
                      <span className="undara-dashboard-account-avatar grid size-9 shrink-0 place-items-center rounded-full border border-current/25 bg-transparent font-[family-name:var(--font-undara-mono)] text-[12px] font-semibold uppercase text-current">
                        {ctx?.profile.avatarUrl ? (
                          <Image src={ctx.profile.avatarUrl} alt="" width={36} height={36} unoptimized className="size-full rounded-full object-cover" />
                        ) : profileLabel.slice(0, 2)}
                      </span>
                      <span className="hidden max-w-36 truncate text-sm font-medium sm:inline">{profileLabel}</span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-foreground/75 transition ${profileMenu ? "rotate-180" : ""}`}
                      />
                    </Button>

                    {profileMenu && (
                      <div className="undara-dashboard-account-menu absolute right-0 z-50 mt-3 w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-[24px] border border-primary/35 bg-background p-3 text-foreground shadow-[0_18px_45px_rgba(0,0,0,0.12)] dark:shadow-black/40">
                        <div className="px-2 pb-3 pt-1">
                          <p className="font-[family-name:var(--font-undara-heading)] text-base font-semibold">
                            {profileLabel}
                          </p>
                          <p className="mt-1 truncate text-xs text-muted-foreground">
                            {ctx?.profile.email || ""}
                          </p>
                        </div>
                        <div className="mb-2 flex items-center gap-2 px-2 sm:hidden">
                          <ThemeToggle />
                          <LanguageToggle />
                        </div>
                        <div className="space-y-1.5">
                          <DashboardMenuItem
                            icon={UserRound}
                            text={d("Profil Saya")}
                            onClick={() => { setProfileSection("profile"); go("profile"); }}
                          />
                          <DashboardMenuItem
                            icon={KeyRound}
                            text={d("Pengaturan akun")}
                            onClick={() => { setProfileSection("security"); go("profile"); }}
                          />
                          <div className="my-2 border-t border-primary/15" />
                          <DashboardMenuItem
                            icon={Receipt}
                            text={d("Lihat transaksi")}
                            onClick={() => router.push("/transactions")}
                          />
                          <DashboardMenuItem
                            icon={Settings2}
                            text={d("Beli layanan")}
                            onClick={() => router.push("/packages")}
                          />
                          <DashboardMenuItem
                            icon={CircleHelp}
                            text={d("Buka FAQ")}
                            onClick={() => router.push("/faq")}
                          />
                          <div className="my-2 border-t border-border" />
                          <DashboardMenuItem icon={LogOut} text={d("Keluar akun")} danger onClick={logout} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main ref={contentScrollRef} tabIndex={0} aria-label={d("Konten dashboard")} className="undara-dashboard-scroll min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain scroll-smooth focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-primary">
            {tab === "overview" && (
              <WorkspaceOverview ctx={ctx} events={events} onGo={go} />
            )}
            {tab === "profile" && ctx && (
              <DashboardAccountPanel
                displayName={ctx.profile.displayName}
                email={ctx.profile.email}
                avatarUrl={ctx.profile.avatarUrl}
                section={profileSection}
                onSectionChange={setProfileSection}
                onUpdated={load}
              />
            )}
            {tab === "events" && <EventPanelEditor
              onSaved={(created) => {
                void load();
                if (pendingTemplate && created) {
                  router.push(`/dashboard/editor?invitationId=${encodeURIComponent(created.id)}&type=${created.type}&template=${encodeURIComponent(pendingTemplate)}`);
                }
              }}
              selectedTemplate={pendingTemplate || undefined}
              accent={accent}
            />}
            {tab === "invitation" && (
              <InvitationWorkspacePanel onCreateSequence={() => go("events")} />
            )}
            {tab === "waBlast" && <WhatsAppBlastPanel selectedEventId={activeEventId} onSelectEvent={selectEvent} />}
            {tab === "personalInvitation" && <PersonalInvitationPanel selectedEventId={activeEventId} onSelectEvent={selectEvent} />}
            {tab === "rsvp" && (
              <RsvpWorkspace
                events={events}
                selectedId={rsvpEventId}
                onSelect={selectEvent}
                selectedEvent={rsvpEvent}
                guests={rsvpGuests}
                loading={rsvpLoading}
                onRefresh={refreshRsvp}
                accent={accent}
              />
            )}
            {tab === "placement" && (
              <PlacementWorkspace
                events={events}
                selectedId={placementEventId}
                onSelect={selectEvent}
                selectedEvent={placementEvent}
                guests={placementGuests}
                tables={placementTables}
                loading={placementLoading}
                accent={accent}
                onRefresh={refreshPlacement}
              />
            )}
            {tab === "usher" && (
              <FeatureGate
                allowed={canGuestbook}
                title="Usher App"
                description={d("Tersedia pada layanan DashboardGuest Book Digital.")}
                upgradeLabel={d("Lihat DashboardGuest Book Digital")}
                onUpgrade={() => router.push("/packages?package=GUESTBOOK_DIGITAL")}
              >
                <UsherPanel
                  events={events}
                  selectedId={usherEventId}
                  onSelect={selectEvent}
                  guests={usherGuests}
                  onRefresh={refreshUsher}
                />
              </FeatureGate>
            )}
          </main>
        </div>

        <DashboardWhatsAppHelp />
      </div>

      {onboarding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-xl border border-border bg-background p-6 shadow-2xl dark:bg-[#0B0B0C] sm:p-8">
            <p className="font-[family-name:var(--font-undara-mono)] text-[11px] font-medium uppercase tracking-[0.2em] text-primary">
              {d("Setup awal")}
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-undara-heading)] text-2xl">
              {d("Profil akun")}
            </h2>
            <div className="mt-6">
              <DashboardField
                label={d("Nama panggilan")}
                value={nickname}
                onChange={setNickname}
                placeholder={d("Contoh: Hendro")}
              />
            </div>
            {onboardingError && (
              <p className="mt-4 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-xs text-red-700 dark:text-red-300">
                {onboardingError}
              </p>
            )}
            <Button disabled={saving} onClick={saveOnboarding} size="lg" className="mt-6 w-full">
              <CheckCircle2 className="h-4 w-4" />
              {saving ? d("Menyimpan data...") : d("Simpan & masuk")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
