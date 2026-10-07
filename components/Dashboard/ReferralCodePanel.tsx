"use client";

import { FloatingField } from "@/components/ui/floating-field";
import { FormEvent, useEffect, useRef, useState } from "react";
import { TicketPercent, X } from "lucide-react";
import { useLanguage } from "@/components/I18n/LanguageProvider";
import { Button } from "@/components/ui/button";
import { controlStyles } from "@/components/ui/control-styles";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function ReferralCodePanel() {
  const { locale } = useLanguage();
  const en = locale === "en";
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [applied, setApplied] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const requestRef = useRef<AbortController | null>(null);

  useEffect(() => () => requestRef.current?.abort(), []);

  async function loadCode() {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setLoading(true);
    setMessage("");
    setInput("");
    setApplied("");
    try {
      const response = await fetch("/api/dashboard/referral", { cache: "no-store", signal: controller.signal });
      if (!response.ok) throw new Error();
      const data = await response.json();
      if (controller.signal.aborted) return;
      setInput(data.code ?? "");
      setApplied(data.active ? data.code : "");
      if (data.code && !data.active) setMessage(en ? "This code is no longer active. Enter another code." : "Kode ini sudah tidak aktif. Masukkan kode lain.");
    } catch {
      if (!controller.signal.aborted) setMessage(en ? "The referral code could not be loaded." : "Kode referral belum dapat dimuat.");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }

  function changeOpen(next: boolean) {
    setOpen(next);
    if (next) void loadCode();
    else requestRef.current?.abort();
  }

  async function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || loading || !input.trim()) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/dashboard/referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: input }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Kode belum dapat dipakai.");
      setInput(data.code);
      setApplied(data.code);
      setMessage(en ? "Code saved." : "Kode tersimpan.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Kode belum dapat dipakai.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/dashboard/referral", { method: "DELETE" });
      if (!response.ok) throw new Error();
      setInput("");
      setApplied("");
      setMessage(en ? "Referral code removed." : "Kode referral dihapus.");
    } catch {
      setMessage(en ? "The code could not be removed." : "Kode belum dapat dihapus.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger render={<Button size="lg" className="dc-dashboard-overview-cta" disabled={busy} />}>
        <TicketPercent className="size-4" aria-hidden="true" />{en ? "Referral Code" : "Kode Referral"}
      </DialogTrigger>
      <DialogContent initialFocus={inputRef} showCloseButton={false} overlayClassName="z-[100]" className="z-[101] max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md">
        <DialogHeader className="pr-12">
          <DialogTitle className="font-[family-name:var(--font-undara-heading)] text-xl font-semibold text-primary">{en ? "Referral Code" : "Kode Referral"}</DialogTitle>
          <DialogDescription className="sr-only">{en ? "Enter your partner referral code." : "Masukkan kode referral Mitra."}</DialogDescription>
        </DialogHeader>
        <DialogClose render={<Button size="icon-sm" className="absolute right-4 top-4" aria-label={en ? "Close" : "Tutup"} />}>
          <X className="size-4" aria-hidden="true" />
        </DialogClose>
        <form onSubmit={apply} className="space-y-4" aria-busy={loading || busy}>
          <FloatingField label={en ? "Referral Code" : "Kode Referral"} className="block text-sm font-medium" htmlFor="dashboard-referral-code">
            <input ref={inputRef} id="dashboard-referral-code" name="referralCode" autoComplete="off" autoCapitalize="characters" spellCheck={false} required maxLength={32} readOnly={loading} disabled={busy} value={input} onChange={(event) => setInput(event.target.value.toUpperCase())} placeholder="MITRA-XXXXXXXX" className={`${controlStyles.input} mt-2 font-mono uppercase`} />
          </FloatingField>
          {(loading || message) && <p role="status" aria-live="polite" className="text-sm text-foreground">{loading ? (en ? "Loading..." : "Memuat...") : message}</p>}
          <div className="flex flex-wrap justify-end gap-2">
            {applied && <Button type="button" disabled={busy || loading} onClick={remove}>{en ? "Remove" : "Hapus"}</Button>}
            <Button type="submit" disabled={busy || loading || !input.trim()}>{busy ? (en ? "Saving..." : "Menyimpan...") : "Submit"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
