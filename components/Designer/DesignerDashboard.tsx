"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { isEditableTemplateStatus } from "@/lib/templates/template-editing";

type Template = {
  id: string;
  templateNo: string;
  name: string;
  tags: string[];
  previewUrl: string;
  templateFile: string | null;
  designKey?: string | null;
  status: string;
  isCustom?: boolean;
  customInvitation?: {
    id: string;
    title: string;
    eventCategory: string;
    updatedAt: string;
  } | null;
  salesCount: number;
  orderValue: number;
  createdAt: string;
};

type Summary = {
  templateCount: number;
  templatesWithSales: number;
  salesCount: number;
  orderValue: number;
};

function rupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function DesignerDashboard() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [summary, setSummary] = useState<Summary>({ templateCount: 0, templatesWithSales: 0, salesCount: 0, orderValue: 0 });
  const [message, setMessage] = useState("Memuat template...");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    const response = await fetch("/api/designer/templates", { cache: "no-store" });
    const data = await response.json();
    if (response.ok) {
      setTemplates(data.templates ?? []);
      setSummary(data.summary ?? { templateCount: data.templates?.length ?? 0, templatesWithSales: 0, salesCount: 0, orderValue: 0 });
      setMessage("");
    } else setMessage(data.error ?? "Template belum dapat dimuat.");
  }

  useEffect(() => { void load(); }, []);

  async function submitForReview(id: string) {
    if (busyId) return;
    setBusyId(id);
    setMessage("");
    try {
      const response = await fetch("/api/designer/templates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "SUBMIT_REVIEW" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Draft belum dapat dikirim untuk review.");
      await load();
      setMessage("Draft dikirim ke Owner untuk review atau diberikan ke user yang request.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Draft belum dapat dikirim untuk review.");
    } finally {
      setBusyId(null);
    }
  }

  const statusLabel = (status: string) =>
    status === "PUBLISHED" ? "Published" : status === "REVIEW" ? "Review" : status === "ARCHIVED" ? "Selesai" : "Draft";

  return (
    <main className="mx-auto w-[80vw] max-w-full space-y-8 px-5 py-8 font-[family-name:var(--font-undara-body)]">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-[family-name:var(--font-undara-mono)] text-xs uppercase tracking-[.2em] text-primary">Designer Dashboard</p>
          <h1 className="mt-2 font-[family-name:var(--font-undara-heading)] text-3xl font-semibold">Template Studio</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Custom request dari Owner membawa akses sementara ke foto event user. File tidak masuk Library Designer dan akses ditutup setelah handoff.
          </p>
        </div>
        <Button asChild><Link href="/designer/studio">Buka Template Studio</Link></Button>
      </header>

      <div className="grid gap-4 sm:grid-cols-4">
        <section className="rounded-2xl border border-border bg-background p-5"><p className="text-sm text-muted-foreground">Template saya</p><p className="mt-2 text-3xl font-semibold">{summary.templateCount}</p></section>
        <section className="rounded-2xl border border-border bg-background p-5"><p className="text-sm text-muted-foreground">Pernah terjual</p><p className="mt-2 text-3xl font-semibold">{summary.templatesWithSales}</p></section>
        <section className="rounded-2xl border border-border bg-background p-5"><p className="text-sm text-muted-foreground">Total terjual</p><p className="mt-2 text-3xl font-semibold">{summary.salesCount}</p></section>
        <section className="rounded-2xl border border-border bg-background p-5"><p className="text-sm text-muted-foreground">Nilai order terkait</p><p className="mt-2 text-xl font-semibold">{rupiah(summary.orderValue)}</p></section>
      </div>

      <section className="rounded-2xl border border-border bg-background p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-undara-heading)] text-xl">Template saya</h2>
          <p className="font-[family-name:var(--font-undara-mono)] text-xs text-muted-foreground">{templates.length} template</p>
        </div>
        {!templates.length ? <p className="mt-6 text-sm text-muted-foreground">Belum ada template.</p> : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {templates.map((item) => (
              <article key={item.id} className="overflow-hidden rounded-2xl border border-border">
                <img src={item.previewUrl} alt={item.name} className="aspect-[4/3] w-full object-cover" />
                <div className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-[family-name:var(--font-undara-mono)] text-xs text-primary">#{item.templateNo}</p>
                    <div className="flex items-center gap-2">
                      {item.isCustom && <span className="rounded-md border border-primary/30 px-2 py-1 text-[10px] font-semibold text-primary">Custom User</span>}
                      <span className="rounded-md border border-primary/30 px-2 py-1 text-[10px] font-semibold text-primary">{statusLabel(item.status)}</span>
                    </div>
                  </div>
                  <h3 className="mt-1 font-[family-name:var(--font-undara-heading)] text-lg">{item.name}</h3>
                  {item.isCustom ? (
                    <p className="mt-1 text-xs text-primary">{item.customInvitation ? `Event: ${item.customInvitation.title}` : "Custom selesai · akses data user ditutup"}</p>
                  ) : <p className="mt-1 text-xs text-muted-foreground">Nilai order terkait: {rupiah(item.orderValue)}</p>}
                  <div className="mt-2 flex flex-wrap gap-1">{item.tags.map((tag) => <span key={tag} className="rounded-md border border-border px-2 py-1 text-[10px] text-muted-foreground">{tag}</span>)}</div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {item.templateFile ? (
                      <a className="text-xs text-primary underline" href={item.templateFile} target="_blank" rel="noreferrer">Buka file template</a>
                    ) : (
                      <p className="text-xs text-primary">
                        {item.status === "PUBLISHED" ? "Template Studio · tampil di katalog" : item.isCustom ? "Custom Studio · khusus event yang ditugaskan" : "Template Studio · draft belum tampil di katalog"}
                      </p>
                    )}
                    {item.designKey && isEditableTemplateStatus(item.status) && (
                      <Button asChild size="sm" variant="outline"><Link href={`/designer/studio?draft=${encodeURIComponent(item.id)}`}>Lanjut edit</Link></Button>
                    )}
                    {!item.templateFile && item.status === "DRAFT" && (
                      <Button type="button" size="sm" disabled={busyId === item.id} onClick={() => void submitForReview(item.id)}>{busyId === item.id ? "Mengirim..." : "Kirim ke Owner"}</Button>
                    )}
                    {item.status === "REVIEW" && <span className="text-xs text-muted-foreground">Menunggu konfirmasi Owner</span>}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
