"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Gift, LogOut, QrCode, Search, Sparkles, X } from "lucide-react";

import BrandWordmark from "@/components/Brand/BrandWordmark";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/Theme/ThemeToggle";
import { FloatingField } from "@/components/ui/floating-field";
import { useDashboardI18n } from "@/components/Dashboard/useDashboardI18n";
import { weddingSessionLabel, weddingSessionsFor, type WeddingSession, type WeddingSessionId } from "@/lib/events/wedding-sessions";
import { DashboardPageHeader } from "@/components/Dashboard/DashboardPrimitives";
import { usherTabs } from "@/components/Usher/config";
import {
  CheckinPanel,
  FeaturePanel,
  GuestTable,
  RsvpBadge,
  UsherStat,
} from "@/components/Usher/UsherPanels";
import type { IssuedGuestQr, UsherGuest, UsherTab } from "@/components/Usher/types";
import { parseUsherQrToken, usherQrImageUrl } from "@/components/Usher/utils";

export default function UsherWorkspace({ invitationId, eventTitle }: { invitationId: string; eventTitle: string }) {
  const { locale } = useDashboardI18n();
  const language = locale === "en" ? "EN" : "ID";
  const [tab, setTab] = useState<UsherTab>("checkin");
  const [guests, setGuests] = useState<UsherGuest[]>([]);
  const [sessions, setSessions] = useState<WeddingSession[]>([]);
  const [session, setSession] = useState<WeddingSessionId | "">("");
  const [search, setSearch] = useState("");
  const [scanInput, setScanInput] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [issuingQr, setIssuingQr] = useState(false);
  const [issuedQr, setIssuedQr] = useState<IssuedGuestQr>(null);
  const [selectedGuest, setSelectedGuest] = useState<UsherGuest | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<number | null>(null);
  const checkinBusy = useRef(false);

  const loadGuests = useCallback(async () => {
    try {
      const response = await fetch(`/api/usher/guests?invitationId=${encodeURIComponent(invitationId)}`, { cache: "no-store" });
      const data = await response.json();
      if (response.ok) {
        setGuests(data.guests ?? []);
        const active = weddingSessionsFor(data.invitation ?? {});
        setSessions(active);
        setSession((current) => active.some((item) => item.id === current) ? current : active[0]?.id ?? "");
      } else {
        setMessage(data.error ?? "Data tamu belum dapat dimuat.");
      }
    } catch {
      setMessage("Koneksi ke data tamu gagal.");
    } finally {
      setLoading(false);
    }
  }, [invitationId]);

  useEffect(() => {
    loadGuests();
    const timer = window.setInterval(loadGuests, 5000);
    return () => window.clearInterval(timer);
  }, [loadGuests]);

  const stopScanner = useCallback(() => {
    if (scanTimerRef.current) window.clearInterval(scanTimerRef.current);
    scanTimerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setScannerOpen(false);
  }, []);

  const checkInWithQr = useCallback(async (rawValue: string) => {
    const token = parseUsherQrToken(rawValue);
    if (!token || checkinBusy.current) return;
    checkinBusy.current = true;
    setCheckingIn(true);
    setMessage("Memverifikasi QR tamu...");
    try {
      const response = await fetch("/api/usher/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, invitationId, ...(session ? { session } : {}) }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error ?? "Check-in gagal.");
        return;
      }
      setGuests((current) => current.map((guest) => guest.id === data.guest.id ? { ...guest, ...data.guest, checkedIn: true } : guest));
      setSelectedGuest(data.guest);
      setMessage(`Selamat datang, ${data.guest.name}. QR valid dan check-in berhasil.`);
      setScanInput("");
      stopScanner();
    } catch {
      setMessage("Check-in gagal diproses.");
    } finally {
      checkinBusy.current = false;
      setCheckingIn(false);
    }
  }, [stopScanner, invitationId, session]);

  const startScanner = useCallback(async () => {
    setScannerError("");
    if (!("BarcodeDetector" in window)) {
      setScannerError("Browser ini belum mendukung scanner otomatis. Gunakan input kode QR di bawah.");
      setScannerOpen(true);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      streamRef.current = stream;
      setScannerOpen(true);
      if (videoRef.current) videoRef.current.srcObject = stream;
      const Detector = (window as unknown as { BarcodeDetector: new (options?: { formats?: string[] }) => { detect: (source: CanvasImageSource) => Promise<Array<{ rawValue?: string }>> } }).BarcodeDetector;
      const detector = new Detector({ formats: ["qr_code"] });
      scanTimerRef.current = window.setInterval(async () => {
        const video = videoRef.current;
        if (!video || video.readyState < 2 || video.videoWidth === 0) return;
        try {
          const codes = await detector.detect(video);
          const value = codes[0]?.rawValue;
          if (value) await checkInWithQr(value);
        } catch {
          // Keep scanning when a frame cannot be decoded.
        }
      }, 450);
    } catch {
      setScannerError("Kamera tidak dapat dibuka. Pastikan izin kamera diberikan dan gunakan HTTPS saat online.");
      setScannerOpen(true);
    }
  }, [checkInWithQr]);

  useEffect(() => () => stopScanner(), [stopScanner]);

  function changeSession(value: WeddingSessionId) {
    stopScanner();
    setSession(value);
    setSelectedGuest(null);
    setIssuedQr(null);
    setMessage("");
    setScanInput("");
  }

  const issueGuestQr = async (guest: UsherGuest) => {
    setIssuingQr(true);
    setMessage("");
    try {
      const response = await fetch("/api/usher/qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestId: guest.id }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error ?? "QR tamu gagal dibuat.");
        return;
      }
      setIssuedQr(data);
    } catch {
      setMessage("QR tamu gagal dibuat.");
    } finally {
      setIssuingQr(false);
    }
  };

  const sessionGuests = useMemo(() => sessions.length ? guests
    .filter((guest) => guest.invitedSessions?.includes(session))
    .map((guest) => ({ ...guest, checkedIn: Boolean(guest.sessionCheckIns?.some((entry) => entry.session === session)),
      rsvpStatus: guest.rsvpStatus === "ATTENDING" && !guest.rsvpEvents?.includes(session) ? "NOT_ATTENDING" : guest.rsvpStatus,
    })) : guests, [guests, sessions, session]);

  const filteredGuests = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return sessionGuests;
    return sessionGuests.filter((guest) => guest.name.toLowerCase().includes(query) || guest.phone?.toLowerCase().includes(query));
  }, [sessionGuests, search]);

  const checkedIn = sessionGuests.filter((guest) => guest.checkedIn);
  const attending = sessionGuests.filter((guest) => guest.rsvpStatus === "ATTENDING");
  const notAttending = sessionGuests.filter((guest) => guest.rsvpStatus === "NOT_ATTENDING");
  const pending = sessionGuests.filter((guest) => guest.rsvpStatus === "PENDING" || guest.rsvpStatus === "TENTATIVE");
  const attendancePercent = sessionGuests.length ? Math.round((checkedIn.length / sessionGuests.length) * 100) : 0;

  return (
    <div className="undara-usher min-h-screen bg-background font-[family-name:var(--font-undara-sans)] text-foreground">
      <header className="sticky top-0 z-30 flex min-h-16 flex-wrap items-center justify-between gap-3 py-3 border-b border-border bg-background/95 px-4 backdrop-blur sm:px-7">
        <div className="flex items-center gap-4">
          <BrandWordmark size="dashboard" />
          <div className="h-5 w-px bg-border" />
          <div><p className="text-xs font-semibold">Usher App</p><p className="max-w-52 truncate text-xs uppercase tracking-[0.08em] text-muted-foreground" title={eventTitle}>{eventTitle}</p></div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <ThemeToggle />
          <span className="hidden rounded-full bg-emerald-500/10 px-3 py-1.5 text-emerald-700 dark:text-emerald-300 sm:inline-flex">● Sistem aktif</span>
          <Button onClick={() => (window.location.href = "/dashboard")} className="rounded-lg border border-border px-3 py-2 hover:bg-foreground/5"><LogOut className="mr-1 inline h-3.5 w-3.5" /> Dashboard</Button>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-64px)]">
        <aside className="hidden w-72 shrink-0 border-r border-border bg-background p-4 md:block">
          <p className="px-3 pb-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Operasional Hari-H</p>
          <nav className="space-y-1">
            {usherTabs.map((item) => {
              const Icon = item.icon;
              return <Button key={item.id} onClick={() => setTab(item.id)} aria-current={tab === item.id ? "page" : undefined} className={`w-full justify-start whitespace-normal px-3 py-3 text-left text-sm ${tab === item.id ? "" : "border-transparent bg-transparent text-foreground shadow-none hover:bg-primary hover:text-white"}`}><Icon className="h-4 w-4" /><span>{item.label}</span>{item.id === "attendance" && <span className="ml-auto rounded-full bg-primary px-1.5 py-0.5 text-xs text-white">LIVE</span>}</Button>;
            })}
          </nav>
          <div className="mt-8 rounded-2xl bg-background p-4">
            <p className="text-xs font-semibold text-primary">Aturan pintu masuk</p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">QR resmi adalah satu-satunya validasi untuk masuk venue. Cari nama hanya untuk memeriksa status undangan dan menerbitkan QR.</p>
          </div>
        </aside>

        <main className="min-w-0 flex-1 py-6">
          <div className="undara-dashboard-page">
            {sessions.length > 0 && <div className="mb-5 flex flex-wrap items-center gap-3">
              <FloatingField label={language === "EN" ? "Active session" : "Sesi aktif"} className="w-full max-w-sm">
                <select value={session} onChange={(event) => changeSession(event.target.value as WeddingSessionId)} disabled={checkingIn || sessions.length === 1} className="min-h-11 w-full rounded-[var(--undara-control-radius)] border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50">
                  {sessions.map((item) => <option key={item.id} value={item.id}>{weddingSessionLabel(item, language)}</option>)}
                </select>
              </FloatingField>
              <p className="text-xs text-muted-foreground">{language === "EN" ? "Guests, RSVP, and check-in follow the selected session." : "Daftar tamu, RSVP, dan check-in mengikuti sesi yang dipilih."}</p>
            </div>}
            <div className="mb-6 flex gap-2 overflow-x-auto md:hidden">
              {usherTabs.map((item) => <Button key={item.id} onClick={() => setTab(item.id)} aria-current={tab === item.id ? "page" : undefined} className={`shrink-0 ${tab === item.id ? "" : "border-border bg-background text-foreground shadow-none"}`}>{item.label}</Button>)}
            </div>

            {tab === "checkin" && <CheckinPanel scannerOpen={scannerOpen} scannerError={scannerError} videoRef={videoRef} scanInput={scanInput} setScanInput={setScanInput} startScanner={startScanner} stopScanner={stopScanner} checkInWithQr={checkInWithQr} checkingIn={checkingIn} checkedIn={checkedIn} guests={sessionGuests} attendancePercent={attendancePercent} selectedGuest={selectedGuest} />}

            {tab === "guests" && <section className="space-y-6">
              <DashboardPageHeader eyebrow="Guest directory" title="Daftar Tamu Diundang" description="Semua nama di sini berasal dari daftar tamu acara. Status RSVP tidak menentukan boleh tidaknya masuk; tamu tetap harus memiliki QR resmi." />
              <div className="grid gap-4 sm:grid-cols-4"><UsherStat label="Total diundang" value={sessionGuests.length} /><UsherStat label="Sudah RSVP hadir" value={attending.length} /><UsherStat label="Belum konfirmasi" value={pending.length} /><UsherStat label="Tidak hadir" value={notAttending.length} /></div>
              <div className="rounded-2xl border border-border bg-background p-5">
                <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama atau nomor WhatsApp..." className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-3 text-xs outline-none focus:border-primary" /></div>
                <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[720px] text-left text-xs"><thead><tr className="border-b border-border text-xs uppercase tracking-[0.14em] text-muted-foreground"><th className="px-3 py-3">Nama tamu</th><th className="px-3 py-3">WhatsApp</th><th className="px-3 py-3">RSVP</th><th className="px-3 py-3">Plus one</th><th className="px-3 py-3">Check-in</th><th className="px-3 py-3 text-right">Aksi</th></tr></thead><tbody>{filteredGuests.map((guest) => <tr key={guest.id} className="border-b border-border/70 last:border-0"><td className="px-3 py-4 font-medium">{guest.name}</td><td className="px-3 py-4 text-muted-foreground">{guest.phone || "—"}</td><td className="px-3 py-4"><RsvpBadge status={guest.rsvpStatus} /></td><td className="px-3 py-4">{guest.plusOnes}</td><td className="px-3 py-4">{guest.checkedIn ? <span className="text-emerald-700 dark:text-emerald-300">Sudah masuk</span> : <span className="text-muted-foreground">Belum masuk</span>}</td><td className="px-3 py-4 text-right"><Button onClick={() => issueGuestQr(guest)} disabled={issuingQr} className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-white disabled:opacity-50">Buat QR</Button></td></tr>)}</tbody></table></div>
              </div>
            </section>}

            {tab === "attendance" && <section className="space-y-6"><DashboardPageHeader eyebrow="Live monitor" title="Realtime Attendance" description="Data diperbarui otomatis setiap 5 detik." /><div className="grid gap-4 sm:grid-cols-3"><UsherStat label="Sudah masuk" value={checkedIn.length} /><UsherStat label="Menunggu" value={sessionGuests.length - checkedIn.length} /><UsherStat label="Total RSVP hadir" value={attending.length} /></div><GuestTable guests={checkedIn} empty="Belum ada tamu yang check-in." /></section>}

            {tab === "rsvp" && <section className="space-y-6"><DashboardPageHeader eyebrow="Smart RSVP" title="Daftar RSVP" description="Pantau siapa yang hadir, belum menjawab, dan tidak hadir. Untuk masuk venue tetap diperlukan QR." /><div className="grid gap-4 sm:grid-cols-3"><UsherStat label="Total diundang" value={sessionGuests.length} /><UsherStat label="Konfirmasi hadir" value={attending.length} /><UsherStat label="Belum konfirmasi" value={pending.length} /></div><GuestTable guests={attending} empty="Belum ada RSVP hadir." /></section>}

            {tab === "greeting" && <FeaturePanel icon={Sparkles} title="Guest Greeting" description={selectedGuest ? `Tamu terakhir: ${selectedGuest.name}.` : "Tampilkan nama tamu setelah QR berhasil diverifikasi untuk sambutan personal."} />}
            {tab === "gift" && <FeaturePanel icon={Gift} title="Gift Corner" description="Catat pengambilan souvenir per tamu, jumlah yang diambil, dan sisa stok secara realtime." />}
            {tab === "giving" && <FeaturePanel icon={QrCode} title="Giving Management" description="Kelola hadiah dan transaksi tamu melalui Guestbook Digital." />}

            {message && <div className="mt-5 rounded-2xl border border-primary/20 bg-background px-4 py-3 text-xs text-foreground">{message}</div>}
            {loading && <p className="fixed bottom-5 right-5 rounded-full bg-black px-4 py-2 text-xs text-white">Memuat data tamu...</p>}
          </div>
        </main>
      </div>

      {issuedQr && <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/50 p-4" onClick={() => setIssuedQr(null)}><div className="w-full max-w-sm rounded-2xl bg-background p-6 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}><Button onClick={() => setIssuedQr(null)} className="float-right rounded-full p-2 hover:bg-foreground/5"><X className="h-4 w-4" /></Button><p className="text-xs uppercase tracking-[0.2em] text-primary">QR tamu diterbitkan</p><h2 className="mt-2 font-[family-name:var(--font-undara-heading)] text-3xl">{issuedQr.guest.name}</h2><p className="mt-2 text-xs text-muted-foreground">Tamu ini ditemukan di daftar undangan. QR ini dapat dipakai sebagai tiket masuk.</p><div className="mx-auto mt-5 w-fit rounded-2xl border border-border bg-white p-3"><img src={usherQrImageUrl(issuedQr.token)} alt={`QR ${issuedQr.guest.name}`} width={280} height={280} /></div><Button onClick={() => window.open(usherQrImageUrl(issuedQr.token), "_blank", "noopener,noreferrer")} className="mt-5 rounded-xl bg-black px-5 py-3 text-xs font-medium text-white">Buka QR ukuran besar</Button></div></div>}
    </div>
  );
}
