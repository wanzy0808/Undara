import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("customer dashboard owns each workspace title only in the sticky header", () => {
  const page = read("app/dashboard/page.tsx");
  const primitives = read("components/Dashboard/DashboardPrimitives.tsx");
  const account = read("components/Dashboard/DashboardAccountPanel.tsx");

  assert.match(
    page,
    /<h1 className="undara-dashboard-header-title[^"]*">\s*\{d\(meta\.title\)\}\s*<\/h1>/,
  );

  const headerStart = primitives.indexOf("export function DashboardPageHeader");
  const headerEnd = primitives.indexOf("/** One large frame per section", headerStart);
  const pageHeader = primitives.slice(headerStart, headerEnd);
  assert.ok(headerStart >= 0 && headerEnd > headerStart);
  assert.doesNotMatch(pageHeader, /<h1\b|\{title\}/);
  assert.match(pageHeader, /actions/);
  assert.match(pageHeader, /children/);

  assert.doesNotMatch(account, /<h1\b[^>]*>\{t\("Profil Saya", "My profile"\)\}<\/h1>/);
  assert.match(account, /aria-label=\{t\("Pengaturan akun", "Account settings"\)\}/);
});
