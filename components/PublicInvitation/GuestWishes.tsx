"use client";

import { useEffect, useId, useState, type CSSProperties, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { useInvitationLanguage } from "@/components/PublicInvitation/InvitationLanguage";
import { invitationText } from "@/lib/invitations/language";
import { invitationFieldColors } from "@/lib/templates/visual-colors";

type Wish = { id: string; authorName: string; message: string; createdAt: string };

export default function GuestWishes({
  slug,
  preview = false,
  appearance = "default",
  initialName = "",
  inputStyle,
  buttonStyle,
}: {
  slug: string;
  preview?: boolean;
  appearance?: "default" | "zen" | "rose";
  initialName?: string;
  inputStyle?: CSSProperties;
  buttonStyle?: CSSProperties;
}) {
  const language = useInvitationLanguage();
  const tr = (text: string) => invitationText(language, text);
  const inputId = useId();
  const messageId = useId();
  const [name, setName] = useState(initialName);
  const [message, setMessage] = useState("");
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [loading, setLoading] = useState(!preview);
  const [fetchError, setFetchError] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const endpoint = `/api/invite/${encodeURIComponent(slug)}/wishes`;
  const rose = appearance === "rose";
  const inputTextStyle = { ...(inputStyle?.fontSize !== undefined ? { fontSize: inputStyle.fontSize } : {}), ...(inputStyle?.color ? { color: inputStyle.color } : {}) };
  const inputFieldStyle = invitationFieldColors(inputStyle);
  const fieldClass = rose
    ? "w-full min-w-0 rounded-[var(--dc-control-radius)] border border-[#d7b5be] bg-white/90 px-4 py-3 text-sm text-[#66394b] outline-none focus-visible:border-[#a65e69] focus-visible:ring-2 focus-visible:ring-[#a65e69]/20 disabled:opacity-65"
    : "w-full min-w-0 rounded-[var(--dc-control-radius)] border border-[var(--inv-soft)] bg-[var(--inv-surface)] px-4 py-3 text-sm text-[var(--inv-scene-surface-ink,var(--inv-ink))] outline-none focus-visible:border-[var(--inv-accent)] focus-visible:ring-2 focus-visible:ring-[var(--inv-accent)]/20 disabled:opacity-65";

  useEffect(() => {
    if (preview || !slug) {
      setLoading(false);
      setWishes([]);
      setFetchError("");
      return;
    }
    let active = true;
    setLoading(true);
    setFetchError("");
    fetch(endpoint, { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error(language === "EN" ? invitationText(language, "Ucapan belum dapat dimuat.") : data?.error || "Ucapan belum dapat dimuat.");
        if (active) setWishes(Array.isArray(data?.wishes) ? data.wishes : []);
      })
      .catch((error: unknown) => {
        if (active) setFetchError(error instanceof Error ? error.message : invitationText(language, "Ucapan belum dapat dimuat."));
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [endpoint, preview, reloadKey, slug, language]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // The Studio/catalog canvas is visual only: never write into a real invitation.
    if (preview || submitting || !slug) return;
    const authorName = name.trim();
    const wishMessage = message.trim();
    if (!authorName || !wishMessage || authorName.length > 80 || wishMessage.length > 600) {
      setSubmitMessage(tr("Isi nama dan ucapan (nama maks. 80 karakter, ucapan maks. 600 karakter)."));
      return;
    }
    setSubmitting(true);
    setSubmitMessage("");
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: authorName, message: wishMessage }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.wish) throw new Error(language === "EN" ? tr("Ucapan belum dapat dikirim.") : data?.error || "Ucapan belum dapat dikirim.");
      setWishes((current) => [data.wish as Wish, ...current].slice(0, 30));
      setMessage("");
      setSubmitMessage(tr("Ucapan berhasil dikirim. Terima kasih!"));
    } catch (error) {
      setSubmitMessage(error instanceof Error ? error.message : tr("Ucapan belum dapat dikirim."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div data-studio-native-object="object:wishes:form-group" className={`mx-auto max-w-md text-left ${rose ? "text-[#765460]" : ""}`}>
      <form onSubmit={submit} className="space-y-4">
        <fieldset data-studio-section-element="wishes:input" style={inputStyle} disabled={submitting} aria-disabled={preview || submitting} className="min-w-0 space-y-4 border-0 p-0">
          <div>
            <label htmlFor={inputId} className="mb-2 block text-sm font-medium" style={inputTextStyle}>{tr("Nama")}</label>
            <input
              id={inputId}
              name="name"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={tr("Nama kamu")}
              maxLength={80}
              required
              className={fieldClass}
              style={inputFieldStyle}
            />
          </div>
          <div>
            <label htmlFor={messageId} className="mb-2 block text-sm font-medium" style={inputTextStyle}>{tr("Ucapan & Doa")}</label>
            <textarea
              id={messageId}
              name="wish"
              rows={4}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={tr("Tulis ucapan atau doa di sini…")}
              maxLength={600}
              required
              className={`${fieldClass} resize-y`}
              style={inputFieldStyle}
            />
          </div>
          <Button data-studio-section-element="wishes:button" style={buttonStyle} type="submit" disabled={submitting} aria-disabled={preview || submitting} size="sm" className="min-h-10">
            {tr(submitting ? "Mengirim…" : "Kirim Ucapan")}
          </Button>
        </fieldset>
        {!preview && submitMessage && <p role="status" aria-live="polite" className="text-sm">{submitMessage}</p>}
      </form>

      {!preview && (
        <div className={`mt-8 border-t pt-5 ${rose ? "border-[#e7cbd3]" : "border-[var(--inv-soft)]"}`}>
          {loading && <p role="status" className="text-sm opacity-70">{tr("Memuat ucapan…")}</p>}
          {fetchError && (
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <p role="alert">{fetchError}</p>
              <Button size="sm" type="button" onClick={() => setReloadKey((value) => value + 1)}>{tr("Coba Lagi")}</Button>
            </div>
          )}
          {!loading && !fetchError && wishes.length === 0 && (
            <p className="text-sm opacity-70">{tr("Belum ada ucapan. Jadilah yang pertama!")}</p>
          )}
          {!loading && !fetchError && wishes.length > 0 && (
            <ul className="space-y-4" aria-label={tr("Ucapan dari tamu")}>
              {wishes.map((wish) => (
                <li key={wish.id} className={`border-b pb-4 last:border-0 ${rose ? "border-[#e7cbd3]" : "border-[var(--inv-soft)]"}`}>
                  <p className="break-words text-sm font-semibold">{wish.authorName}</p>
                  <p className="mt-1 whitespace-pre-line break-words text-sm leading-7">{wish.message}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
