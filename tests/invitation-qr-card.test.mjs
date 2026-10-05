import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import QRCode from "qrcode";
import sharp from "sharp";
import { invitationQrCardGeometry, invitationQrCardTitle, invitationQrDownloadCard } from "../lib/invitations/qr-card.ts";

const target = "https://undara.example.test/q/invitation-a";
const qrPng = await QRCode.toBuffer(target, { type: "png", width: 640, margin: 4, errorCorrectionLevel: "M" });
const pixels = (input) => sharp(input).ensureAlpha().raw().toBuffer();

test("ID/EN thank-you cards preserve every QR pixel and its full white quiet zone", async () => {
  const geometry = invitationQrCardGeometry;
  const expected = await pixels(qrPng);
  const cards = [];
  for (const locale of ["id", "en"]) {
    const card = await invitationQrDownloadCard(qrPng, "ulang tahun Naya", locale);
    cards.push(card);
    const metadata = await sharp(card).metadata();
    assert.equal(metadata.format, "png");
    assert.equal(metadata.width, 900);
    assert.equal(metadata.height, 1320);
    assert.equal(metadata.density, 300);
    const cropped = await sharp(card).extract({ left: geometry.qrLeft, top: geometry.qrTop, width: 640, height: 640 }).ensureAlpha().raw().toBuffer();
    assert.deepEqual(cropped, expected);
    const corner = await sharp(card).extract({ left: 0, top: 0, width: 1, height: 1 }).ensureAlpha().raw().toBuffer();
    assert.deepEqual([...corner], [237, 227, 216, 255]);
  }
  const heading = { left: 80, top: 80, width: 740, height: 240 };
  assert.notDeepEqual(await sharp(cards[0]).extract(heading).raw().toBuffer(), await sharp(cards[1]).extract(heading).raw().toBuffer());
  const event = { left: 80, top: 330, width: 740, height: 80 };
  assert.deepEqual(await sharp(cards[0]).extract(event).raw().toBuffer(), await sharp(cards[1]).extract(event).raw().toBuffer());
});

test("footer uses the exact canonical wordmark alpha, tinted with Undara Brown", async () => {
  const card = await invitationQrDownloadCard(qrPng, "Denny & Christine");
  const alpha = await sharp("public/assets/brand/undara/logo.webp").resize(240, 101).ensureAlpha().extractChannel(3).raw().toBuffer();
  const footer = await sharp(card).extract({ left: 330, top: 1152, width: 240, height: 101 }).removeAlpha().raw().toBuffer();
  let visible = 0;
  let empty = 0;
  for (let i = 0; i < alpha.length; i++) {
    if (alpha[i] !== 0 && alpha[i] !== 255) continue;
    const expected = alpha[i] === 255 ? [112, 59, 59] : [237, 227, 216];
    assert.deepEqual([...footer.subarray(i * 3, i * 3 + 3)], expected);
    if (alpha[i] === 255) visible++; else empty++;
  }
  assert.ok(visible > 1000 && empty > 1000);
});

test("long, blank and markup-like event titles cannot overlap or alter the QR", async () => {
  const original = await pixels(qrPng);
  const { qrLeft: left, qrTop: top } = invitationQrCardGeometry;
  for (const title of ["Perayaan Bersama Sahabat ".repeat(40), "a".repeat(1000), '<span size="999999">Naya & Friends</span>', " 👨‍👩‍👧‍👦 ".repeat(200), null, " "]) {
    const card = await invitationQrDownloadCard(qrPng, title);
    const crop = await sharp(card).extract({ left, top, width: 640, height: 640 }).ensureAlpha().raw().toBuffer();
    assert.deepEqual(crop, original);
    // The print frame may occupy the card edges; the title-to-QR reading area stays clear.
    const gap = await sharp(card).extract({ left, top: 410, width: 640, height: 38 }).removeAlpha().raw().toBuffer();
    for (let i = 0; i < gap.length; i += 3) assert.deepEqual([...gap.subarray(i, i + 3)], [237, 227, 216]);
  }
  assert.equal(invitationQrCardTitle("ulang tahun naya\n & sahabat"), "Ulang Tahun Naya & Sahabat");
  assert.equal(invitationQrCardTitle(" "), "");
  const bounded = invitationQrCardTitle("👨‍👩‍👧‍👦".repeat(140));
  assert.equal([...new Intl.Segmenter("id", { granularity: "grapheme" }).segment(bounded)].length, 121);
  assert.ok(bounded.endsWith("…"));
});

test("invalid QR inputs fail closed rather than producing a card with a missing or resized code", async () => {
  const tiny = await QRCode.toBuffer(target, { width: 320 });
  const wrongFormat = await sharp(qrPng).webp().toBuffer();
  await assert.rejects(invitationQrDownloadCard(tiny, "Naya"), /Invalid invitation QR image/);
  await assert.rejects(invitationQrDownloadCard(wrongFormat, "Naya"), /Invalid invitation QR image/);
  await assert.rejects(invitationQrDownloadCard(Buffer.from("not an image"), "Naya"));
});

test("deployable route trace includes local brand fonts, licenses, wordmark and greeting-card artwork", () => {
  const config = readFileSync(new URL("../next.config.ts", import.meta.url), "utf8");
  assert.match(config, /outputFileTracingIncludes[\s\S]*"\/api\/invitations\/qr"[\s\S]*assets\/brand\/fonts\/\*[\s\S]*public\/assets\/brand\/undara\/logo\.webp/);
  for (const name of ["branch-01.webp", "branch-04.webp", "branch-05.webp"]) {
    assert.ok(config.includes(`./public/assets/landing/ornaments/botanical/${name}`));
  }
  for (const name of ["DMSerifDisplay-OFL.txt", "Roboto-OFL.txt"]) {
    assert.match(readFileSync(new URL(`../assets/brand/fonts/${name}`, import.meta.url), "utf8"), /SIL OPEN FONT LICENSE Version 1\.1/);
  }
});
