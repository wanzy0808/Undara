import path from "node:path";
import sharp from "sharp";
import { displayTitleCase } from "@/lib/text/display-title-case";

export const invitationQrCardGeometry = {
  width: 900, height: 1320, qrSize: 640, qrLeft: 130, qrTop: 448,
} as const;

const brown = "#703B3B";
const ivory = "#EDE3D8";
const fonts = {
  heading: path.join(process.cwd(), "assets/brand/fonts/DMSerifDisplay-Regular.ttf"),
  body: path.join(process.cwd(), "assets/brand/fonts/Roboto.ttf"),
};

function escapeMarkup(text: string) {
  const entities: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" };
  return text.replace(/[&<>"']/g, (character) => entities[character]);
}

function boundedCardText(value: string | null | undefined, limit: number) {
  const normalized = (value ?? "").normalize("NFC")
    .replace(/[\p{Cc}\u200e\u200f\u202a-\u202e\u2066-\u2069]/gu, " ").replace(/\s+/gu, " ").trim();
  let bounded = "";
  let count = 0;
  for (const part of new Intl.Segmenter("id", { granularity: "grapheme" }).segment(normalized)) {
    if (count++ === limit) return bounded.trimEnd() + "…";
    bounded += part.segment;
  }
  return bounded;
}

/** Bound display text without splitting an emoji or changing saved guest data. */
export function invitationQrCardTitle(title?: string | null) {
  return displayTitleCase(boundedCardText(title, 120));
}

export function invitationQrCardGuestName(name: string) {
  return boundedCardText(name, 80);
}

async function textImage(text: string, fontfile: string, font: string, width: number, maxHeight: number) {
  const options = { text: `<span foreground="${brown}">${escapeMarkup(text)}</span>`, fontfile, font, width, align: "center" as const, wrap: "word-char" as const, rgba: true, spacing: 9 };
  const image = await sharp({ text: { ...options, dpi: 72 } }).png().toBuffer({ resolveWithObject: true });
  // Auto-fit only oversized text, so a short event title never grows into a heading.
  return image.info.height <= maxHeight && image.info.width <= width ? image
    : sharp({ text: { ...options, height: maxHeight } }).png().toBuffer({ resolveWithObject: true });
}

let brandLogo: Promise<Buffer> | undefined;
function logoImage() {
  brandLogo ??= (async () => {
    const alpha = await sharp(path.join(process.cwd(), "public/assets/brand/undara/logo.webp"))
      .resize(240, 101).ensureAlpha().extractChannel(3).png().toBuffer();
    // Match BrandWordmark's currentColor alpha mask using the exact canonical asset.
    return sharp({ create: { width: 240, height: 101, channels: 3, background: brown } })
      .joinChannel(alpha).png().toBuffer();
  })().catch((error) => { brandLogo = undefined; throw error; });
  return brandLogo;
}

let cardBackground: Promise<Buffer> | undefined;
function backgroundImage() {
  cardBackground ??= (async () => {
    const ornamentRoot = path.join(process.cwd(), "public/assets/landing/ornaments/botanical");
    const [topCorner, bottomCorner, sprig] = await Promise.all([
      sharp(path.join(ornamentRoot, "branch-01.webp")).resize(320, 240).png().toBuffer(),
      sharp(path.join(ornamentRoot, "branch-04.webp")).resize(300, 225).png().toBuffer(),
      sharp(path.join(ornamentRoot, "branch-05.webp")).trim().resize(176).png().toBuffer(),
    ]);
    // The frame is geometry; the leaf engravings reuse the original Undara artwork.
    const frame = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1320"><rect x="38" y="38" width="824" height="1244" rx="28" fill="none" stroke="#B79778" stroke-width="2"/></svg>`);
    return sharp({ create: { width: 900, height: 1320, channels: 3, background: ivory } })
      .composite([
        { input: frame, left: 0, top: 0 },
        { input: topCorner, left: 12, top: 12 },
        { input: bottomCorner, left: 585, top: 1080 },
        { input: sprig, left: 362, top: 300 },
      ]).png().toBuffer();
  })().catch((error) => { cardBackground = undefined; throw error; });
  return cardBackground;
}

/** Compose the original QR unchanged; copy and branding stay outside its white quiet zone. */
export async function invitationQrDownloadCard(qrPng: Buffer, title: string | null | undefined, guestName: string, locale: "id" | "en" = "id") {
  const geometry = invitationQrCardGeometry;
  const qr = await sharp(qrPng).metadata();
  if (qr.format !== "png" || qr.width !== geometry.qrSize || qr.height !== geometry.qrSize) throw new Error("Invalid invitation QR image.");
  const heading = locale === "en" ? "Thank you" : "Terima kasih";
  const message = locale === "en" ? "for being part of\nour special story." : "telah menjadi bagian dari\ncerita istimewa kami.";
  const eventTitle = invitationQrCardTitle(title);
  const [headingImage, messageImage, titleImage, guestImage, scanImage, logo, background] = await Promise.all([
    textImage(heading, fonts.heading, "DM Serif Display 78", 740, 96),
    textImage(message, fonts.body, "Roboto 34", 740, 94),
    eventTitle ? textImage(eventTitle, fonts.heading, "DM Serif Display 36", 740, 52) : null,
    textImage(invitationQrCardGuestName(guestName) || (locale === "en" ? "Guest" : "Tamu"), fonts.body, "Roboto 28", 740, 42),
    textImage(locale === "en" ? "Present this QR at the entrance" : "Tunjukkan QR ini di pintu masuk", fonts.body, "Roboto 24", 620, 34),
    logoImage(),
    backgroundImage(),
  ]);
  const center = (image: typeof headingImage, top: number) => ({ input: image.data, left: Math.round((geometry.width - image.info.width) / 2), top });
  return sharp(background)
    .composite([
      center(headingImage, 96), center(messageImage, 210),
      ...(titleImage ? [center(titleImage, 332)] : []),
      center(guestImage, 392),
      { input: qrPng, left: geometry.qrLeft, top: geometry.qrTop },
      center(scanImage, 1106),
      { input: logo, left: 330, top: 1152 },
    ]).withMetadata({ density: 300 }).png().toBuffer();
}
