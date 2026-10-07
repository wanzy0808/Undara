"use client";

import { FloatingField } from "@/components/ui/floating-field";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Camera, CheckCircle2, KeyRound, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDashboardI18n } from "@/components/Dashboard/useDashboardI18n";
import { DashboardPage, DashboardSurface } from "@/components/Dashboard/DashboardPrimitives";

type Section = "profile" | "security";
type Props = {
  displayName: string;
  email: string;
  avatarUrl: string | null;
  section: Section;
  onSectionChange: (section: Section) => void;
  onUpdated: () => Promise<void>;
};

export default function DashboardAccountPanel({
  displayName, email, avatarUrl, section, onSectionChange, onUpdated,
}: Props) {
  const { locale } = useDashboardI18n();
  const t = (id: string, en: string) => locale === "en" ? en : id;
  const photoInput = useRef<HTMLInputElement>(null);
  const [firstName, setFirstName] = useState(displayName);
  const [lastName, setLastName] = useState("");
  const [photo, setPhoto] = useState(avatarUrl);
  const [busy, setBusy] = useState<"" | "photo" | "profile" | "password">("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/profile", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error("Profile unavailable");
        return res.json();
      })
      .then(({ user }) => {
        if (!active) return;
        setFirstName(user.firstName ?? "");
        setLastName(user.lastName ?? "");
        setPhoto(user.avatarUrl ?? null);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  async function uploadPhoto(file?: File) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024 || file.size === 0) {
      setError(t("Pilih JPG, PNG, atau WebP maksimal 5 MB.", "Choose a JPG, PNG, or WebP image under 5 MB."));
      return;
    }
    setBusy("photo"); setError(""); setNotice("");
    try {
      const data = new FormData();
      data.append("file", file);
      const response = await fetch("/api/profile/avatar", { method: "POST", body: data });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Upload failed");
      setPhoto(result.avatarUrl);
      setNotice(t("Foto profil diperbarui.", "Profile photo updated."));
      await onUpdated();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("Foto belum tersimpan.", "Photo was not saved."));
    } finally {
      setBusy("");
      if (photoInput.current) photoInput.current.value = "";
    }
  }

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!firstName.trim() || firstName.trim().length > 80 || lastName.trim().length > 80) {
      setError(t("Nama depan wajib diisi (maksimal 80 karakter).", "First name is required (maximum 80 characters)."));
      return;
    }
    setBusy("profile"); setError(""); setNotice("");
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName: firstName.trim(), lastName: lastName.trim() }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Save failed");
      setFirstName(result.user.firstName);
      setLastName(result.user.lastName ?? "");
      setNotice(t("Profil berhasil disimpan.", "Profile saved."));
      await onUpdated();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("Profil belum tersimpan.", "Profile was not saved."));
    } finally {
      setBusy("");
    }
  }

  async function savePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      setError(t("Konfirmasi password tidak sama.", "Passwords do not match."));
      return;
    }
    if (newPassword.length < 8) {
      setError(t("Password baru minimal 8 karakter.", "New password must have at least 8 characters."));
      return;
    }
    setBusy("password"); setError(""); setNotice("");
    try {
      const response = await fetch("/api/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Password update failed");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      setNotice(t("Password berhasil diganti. Sesi di perangkat lain telah diakhiri.", "Password changed. Other device sessions were signed out."));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("Password belum diganti.", "Password was not changed."));
    } finally {
      setBusy("");
    }
  }

  return (
    <DashboardPage className="undara-dashboard-account-page">
      <div className="mb-6 flex flex-wrap justify-end gap-4">
        <div className="flex flex-wrap gap-2" role="group" aria-label={t("Pengaturan akun", "Account settings")}>
          <Button type="button" variant={section === "profile" ? "default" : "outline"} onClick={() => { setError(""); setNotice(""); onSectionChange("profile"); }}>
            <UserRound className="size-4" />{t("Profil", "Profile")}
          </Button>
          <Button type="button" variant={section === "security" ? "default" : "outline"} onClick={() => { setError(""); setNotice(""); onSectionChange("security"); }}>
            <ShieldCheck className="size-4" />{t("Keamanan", "Security")}
          </Button>
        </div>
      </div>

      {notice && <p role="status" className="undara-dashboard-notice mb-4 rounded-tr-[22px] border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground">{notice}</p>}
      {error && <p role="alert" className="mb-4 rounded-2xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">{error}</p>}

      {section === "profile" ? (
        <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(250px,0.7fr)_minmax(0,1.3fr)]">
          <DashboardSurface className="p-6">
            <h2 className="text-xl font-semibold text-primary">{t("Foto profil", "Profile photo")}</h2>
            <div className="mt-6 flex flex-col items-center text-center">
              <div className="relative grid size-32 place-items-center overflow-hidden rounded-full border-2 border-primary/60 bg-primary/10">
                {photo ? <Image src={photo} alt={t("Foto profil", "Profile photo")} width={128} height={128} unoptimized className="size-full object-cover" /> : <UserRound className="size-12 text-primary" aria-hidden="true" />}
              </div>
              <input ref={photoInput} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label={t("Pilih foto profil", "Choose profile photo")} onChange={(event) => uploadPhoto(event.target.files?.[0])} />
              <Button type="button" size="sm" className="mt-5" disabled={busy !== ""} onClick={() => photoInput.current?.click()}>
                <Camera className="size-4" />{busy === "photo" ? t("Mengunggah...", "Uploading...") : t("Ganti foto", "Change photo")}
              </Button>
              <p className="mt-3 text-sm text-muted-foreground">JPG, PNG, WebP · 5 MB</p>
            </div>
          </DashboardSurface>

          <DashboardSurface className="p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-primary">{t("Informasi pribadi", "Personal information")}</h2>
            <form className="mt-6 space-y-5" onSubmit={saveProfile}>
              <div className="grid gap-4 sm:grid-cols-2">
                <FloatingField label={t("Nama depan", "First name")} className="block text-sm text-foreground">
                  <Input autoComplete="given-name" required maxLength={80} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </FloatingField>
                <FloatingField label={t("Nama belakang", "Last name")} className="block text-sm text-foreground">
                  <Input autoComplete="family-name" maxLength={80} value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </FloatingField>
              </div>
              <div className="text-sm text-foreground">
                <FloatingField label="Email">
                  <Input value={email} readOnly aria-readonly="true" className="cursor-not-allowed opacity-75" />
                </FloatingField>
                <span className="mt-2 block text-xs text-muted-foreground">{t("Email akun tidak dapat diubah di sini.", "Account email cannot be changed here.")}</span>
              </div>
              <Button type="submit" disabled={busy !== ""} size="lg">
                <CheckCircle2 className="size-4" />{busy === "profile" ? t("Menyimpan...", "Saving...") : t("Simpan perubahan", "Save changes")}
              </Button>
            </form>
          </DashboardSurface>
        </div>
      ) : (
        <DashboardSurface className="max-w-3xl p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-full bg-primary/10 text-primary"><KeyRound className="size-5" /></span>
            <div>
              <h2 className="text-xl font-semibold text-primary">{t("Ganti password", "Change password")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("Gunakan password yang berbeda dari sebelumnya.", "Use a password you have not used before.")}</p>
            </div>
          </div>
          <form className="mt-7 max-w-xl space-y-5" onSubmit={savePassword}>
            <FloatingField label={t("Password saat ini", "Current password")} className="block text-sm text-foreground">
              <Input type="password" autoComplete="current-password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
            </FloatingField>
            <FloatingField label={t("Password baru", "New password")} className="block text-sm text-foreground">
              <Input type="password" autoComplete="new-password" minLength={8} required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </FloatingField>
            <FloatingField label={t("Konfirmasi password baru", "Confirm new password")} className="block text-sm text-foreground">
              <Input type="password" autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </FloatingField>
            <Button type="submit" size="lg" disabled={busy !== ""}>
              <KeyRound className="size-4" />{busy === "password" ? t("Menyimpan...", "Saving...") : t("Ganti password", "Change password")}
            </Button>
          </form>
        </DashboardSurface>
      )}
    </DashboardPage>
  );
}
