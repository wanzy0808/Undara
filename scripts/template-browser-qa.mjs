/**
 * Read-only QA of the real public gallery on a disposable CI server.
 * Uses the runner's Chrome + Node's WebSocket; adds no application dependency.
 * Screenshots are review evidence, not a pixel-baseline or paid-event E2E claim.
 */
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { invitationTemplates } from "../lib/templates/catalog.ts";
import { invitationPalettes } from "../lib/templates/design.ts";
import { readableInk, contrastRatio } from "../lib/templates/presentation.ts";
import { familyArtDirection } from "../lib/templates/family-art-directions.ts";

const output = "artifacts/template-browser";
await mkdir(output, { recursive: true });
const profile = await mkdtemp(join(tmpdir(), "undara-template-qa-"));
const chromePath = process.env.TEMPLATE_QA_CHROME || ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find(existsSync);
assert.ok(chromePath, "Chrome is required for browser QA");
const origin = "http://127.0.0.1:3000";
const serverLog = [];
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1"], {
  env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL || "postgresql://ci:ci@127.0.0.1:5432/undara_qa", AUTH_SECRET: "disposable-public-gallery-qa" },
  stdio: ["ignore", "pipe", "pipe"],
});
server.stdout.on("data", (b) => serverLog.push(b.toString()));
server.stderr.on("data", (b) => serverLog.push(b.toString()));
const chrome = spawn(chromePath, ["--headless=new", "--no-sandbox", "--disable-dev-shm-usage", "--remote-debugging-port=0", "--user-data-dir=" + profile, "about:blank"], { stdio: "ignore" });
let socket;
let counter = 0;
const requests = new Map();
const exceptions = [];
const report = [];
const themes = invitationTemplates.filter((t) => familyArtDirection(t.key));
const viewports = [320, 390, 768, 1440];
let lastExpression = "";
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function until(check, message, timeout = 30000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await check()) return;
    await pause(100);
  }
  throw new Error(message);
}
function send(method, params = {}, sessionId) {
  const id = ++counter;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { requests.delete(id); reject(new Error("CDP timeout: " + method)); }, 15000);
    requests.set(id, { resolve, reject, timer });
    socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
}
try {
  await until(async () => {
    try { return (await fetch(origin + "/api/templates")).ok; } catch { return false; }
  }, "Public gallery server did not start");
  const portFile = join(profile, "DevToolsActivePort");
  await until(() => existsSync(portFile), "Chrome did not start");
  const [port] = (await readFile(portFile, "utf8")).split("\n");
  const info = await (await fetch("http://127.0.0.1:" + port + "/json/version")).json();
  socket = new WebSocket(info.webSocketDebuggerUrl);
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    const pending = requests.get(message.id);
    if (pending) {
      clearTimeout(pending.timer);
      requests.delete(message.id);
      if (message.error) pending.reject(new Error(JSON.stringify(message.error)));
      else pending.resolve(message.result);
    }
    if (message.method === "Runtime.exceptionThrown") exceptions.push(message.params.exceptionDetails);
  });
  await new Promise((resolve, reject) => { socket.addEventListener("open", resolve, { once: true }); socket.addEventListener("error", reject, { once: true }); });
  const { targetId } = await send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
  const call = (method, params) => send(method, params, sessionId);
  const evaluate = async (expression) => {
    lastExpression = expression;
    const result = await call("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result.value;
  };
  await call("Page.enable");
  await call("Runtime.enable");
  for (const width of viewports) {
    await call("Emulation.setDeviceMetricsOverride", { width, height: width < 768 ? 844 : 1024, deviceScaleFactor: 1, mobile: width < 768 });
    await call("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
    for (const theme of themes) {
      await call("Page.navigate", { url: origin + "/template-design?template=" + theme.key });
      await until(() => evaluate('Boolean(document.querySelector("[role=dialog] .rf-envelope .ot-open"))'), "Missing envelope: " + theme.key);
      await until(() => evaluate('[...document.querySelectorAll("[role=dialog] .rf-envelope img")].every(i => i.complete && i.naturalWidth > 0)'), "Broken envelope image: " + theme.key);
      // Await layout/paint; late font loading must settle before evidence is captured.
      const fontsReady = await evaluate("Promise.race([document.fonts.ready.then(() => true), new Promise(resolve => setTimeout(() => resolve(false), 2500))])");
      console.log("Envelope ready:", theme.key, width, "fonts settled:", fontsReady);
      await pause(200);
      if (width === 390 || (width === 1440 && theme.eventCategories[0] === "BIRTHDAY")) {
        await evaluate('document.querySelector("[role=dialog] .rf-envelope .ot-open").scrollIntoView({block:"center"})');
        const capture = await call("Page.captureScreenshot", { format: "png" });
        await writeFile(join(output, theme.key + (width === 1440 ? "-desktop" : "") + "-envelope.png"), Buffer.from(capture.data, "base64"));
      }
      await evaluate('document.querySelector("[role=dialog] .rf-envelope .ot-open").click()');
      await until(() => evaluate('Boolean(document.querySelector("[role=dialog] .rf-cover h1"))'), "Invitation did not open: " + theme.key);
      await until(() => evaluate('[...document.querySelectorAll("[role=dialog] .rf-cover img")].every(i => i.complete && i.naturalWidth > 0)'), "Broken cover image: " + theme.key);
      await evaluate('document.querySelector("[role=dialog] .rf-cover").scrollIntoView({block:"start"})');
      await pause(200);
      const measured = await evaluate(`(() => {
        const root = document.querySelector("[role=dialog] .family-stationery-invitation");
        const cover = root.querySelector(".rf-cover");
        const title = cover.querySelector("h1");
        const a = root.getBoundingClientRect(), b = title.getBoundingClientRect();
        const objects = [...cover.querySelectorAll("[data-studio-native-object]")].map(n => n.dataset.studioNativeObject);
        return { canvasWidth: a.width, coverHeight: cover.offsetHeight, title: title.textContent,
          titleColor: getComputedStyle(title).color,
          titleBackground: getComputedStyle(title.parentElement).backgroundColor,
          titleFits: b.left >= a.left - 1 && b.right <= a.right + 1,
          overflow: cover.scrollWidth - cover.clientWidth,
          uniqueObjects: objects.length === new Set(objects).size,
          sections: [...root.querySelectorAll("[data-invitation-section]")].map(n => n.dataset.invitationSection) };
      })()`);
      assert.ok(measured.titleFits && measured.overflow <= 1 && measured.uniqueObjects, JSON.stringify({ theme: theme.key, width, ...measured }));
      if (theme.eventCategories[0] === "BIRTHDAY") assert.equal(measured.title, "Dara", "Birthday sample must keep the canonical single name");
      const palette = invitationPalettes[theme.preset.palette];
      const hex = (rgb) => "#" + rgb.match(/[\d.]+/g).slice(0,3).map(n => Math.round(Number(n)).toString(16).padStart(2,"0")).join("");
      const surface = ["giok-abadi", "rumah-senja", "porcelain-bloom"].includes(theme.key) ? palette.surface : palette.bg;
      assert.equal(hex(measured.titleColor), readableInk(surface, palette.ink), "Heading must use its invitation surface ink, not the marketing brand: " + theme.key);
      assert.ok(contrastRatio(hex(measured.titleColor), surface) >= 4.5, "Actual heading contrast: " + theme.key);
      const longNameFits = await evaluate(`(() => {
        const cover = document.querySelector("[role=dialog] .rf-cover");
        const title = cover.querySelector("h1");
        const old = title.textContent;
        title.textContent = "Alexander Nathaniel Wijaya & Gabriella Michelle Tan";
        const a = cover.getBoundingClientRect(), b = title.getBoundingClientRect();
        const fits = b.left >= a.left - 1 && b.right <= a.right + 1 && cover.scrollWidth <= cover.clientWidth + 1;
        title.textContent = old;
        return fits;
      })()`);
      assert.ok(longNameFits, "Long-name overflow: " + theme.key + " at " + width);
      for (const required of ["cover", "greeting", "identity", "event", "dateTime", "gallery", "countdown", "location", "rsvp", "wishes", "gift", "closing", "footer"]) {
        assert.ok(measured.sections.includes(required), theme.key + " missing " + required);
      }
      report.push({ theme: theme.key, viewport: width, fontsReady, ...measured });
      if (width === 390 || (width === 1440 && theme.eventCategories[0] === "BIRTHDAY")) {
        const capture = await call("Page.captureScreenshot", { format: "png" });
        await writeFile(join(output, theme.key + (width === 1440 ? "-desktop" : "") + "-cover.png"), Buffer.from(capture.data, "base64"));
      }
      if (width === 390) {
        await evaluate('document.querySelector("[role=dialog] [data-invitation-section=greeting]").scrollIntoView({block:"start"})');
        await until(() => evaluate('[...document.querySelectorAll("[role=dialog] [data-invitation-section=greeting] img")].every(i => i.complete && i.naturalWidth > 0)'), "Broken greeting artwork: " + theme.key);
        const content = await call("Page.captureScreenshot", { format: "png" });
        await writeFile(join(output, theme.key + "-greeting.png"), Buffer.from(content.data, "base64"));
        if (theme.eventCategories[0] === "BIRTHDAY") {
          for (const section of ["identity", "dateTime", "gallery", "rsvp", "closing"]) {
            await evaluate(`document.querySelector('[role=dialog] [data-invitation-section="${section}"]').scrollIntoView({block:"start"})`);
            await until(() => evaluate(`[...document.querySelectorAll('[role=dialog] [data-invitation-section="${section}"] img')].every(i => i.complete && i.naturalWidth > 0)`), "Broken section image: " + theme.key + "/" + section);
            await pause(100);
            const body = await call("Page.captureScreenshot", { format: "png" });
            await writeFile(join(output, theme.key + "-" + section + ".png"), Buffer.from(body.data, "base64"));
          }
        }
        await call("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "no-preference" }] });
        await call("Page.navigate", { url: origin + "/template-design?template=" + theme.key });
        await until(() => evaluate('Boolean(document.querySelector("[role=dialog] .rf-envelope .ot-open"))'), "Missing pointer opening control");
        const button = await evaluate(`(() => {
          const button = document.querySelector("[role=dialog] .rf-envelope .ot-open");
          button.scrollIntoView({block:"center"});
          const box = button.getBoundingClientRect();
          return {x:box.x+box.width/2,y:box.y+box.height/2};
        })()`);
        await call("Input.dispatchMouseEvent", { type: "mousePressed", button: "left", clickCount: 1, ...button });
        await call("Input.dispatchMouseEvent", { type: "mouseReleased", button: "left", clickCount: 1, ...button });
        await until(() => evaluate('Boolean(document.querySelector("[role=dialog] .rf-envelope[data-opening=true]"))'), "Pointer opening must animate: " + theme.key, 600);
        await until(() => evaluate('Boolean(document.querySelector("[role=dialog] .rf-cover h1"))'), "Pointer opening did not finish");
        await call("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
      }
    }
  }
  assert.equal(exceptions.length, 0, JSON.stringify(exceptions));
  console.log("PASS:", report.length, "real gallery previews; envelope, cover, assets, section continuity and horizontal layout.");
} finally {
  await writeFile(join(output, "report.json"), JSON.stringify({ report, exceptions, lastExpression }, null, 2));
  if (report.length !== themes.length * viewports.length) console.error("Last browser expression:", lastExpression);
  await writeFile(join(output, "server.log"), serverLog.join(""));
  socket?.close();
  chrome.kill();
  server.kill();
  await rm(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
}
