import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) =>
  fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("placement header does not repeat the selected event title", () => {
  const page = read("app/dashboard/page.tsx");
  assert.match(page, /const scopedHeaderEvent = tab === "rsvp" \? rsvpEvent : null;/);
  assert.doesNotMatch(page, /tab === "placement" \? placementEvent/);
});

test("customer dashboard event labels use display-only Title Case", () => {
  const page = read("app/dashboard/page.tsx");
  const workspaces = read("components/Dashboard/DashboardWorkspaces.tsx");
  const events = read("components/Dashboard/EventPanel.tsx");
  const invitations = read("components/Dashboard/InvitationWorkspacePanel.tsx");

  assert.match(page, /displayTitleCase\(scopedHeaderEvent\.title\)/);
  assert.match(workspaces, /displayTitleCase\(event\.title \|\| d\("Acara tanpa judul"\)\)/);
  assert.match(events, /displayTitleCase\(draft \? d\("Acara baru"\) : event\.title \|\| d\("Acara tanpa judul"\)\)/);
  assert.match(invitations, /const title = displayTitleCase\(invitation\.title\.trim\(\) \|\| d\("Acara tanpa judul"\)\);/);
  assert.match(invitations, /displayTitleCase\(guest\.invitation\?\.title \|\| d\("Acara tanpa judul"\)\)/);
});
