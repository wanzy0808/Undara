import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (name) => readFileSync(new URL(`../${name}`, import.meta.url), "utf8");
const schema = read("prisma/schema.prisma");
const migration = read("prisma/migrations/20260924183000_guest_wishes/migration.sql");
const route = read("app/api/invite/[slug]/wishes/route.ts");
const component = read("components/PublicInvitation/GuestWishes.tsx");
const studio = read("components/InvitationStudio/DesignerPanels.tsx");
const universal = read("components/PublicInvitation/UniversalInvitationTemplate.tsx");
const rose = read("components/PublicInvitation/RomanticRoseTemplate.tsx");

test("Studio shows one legible Ucapan Tamu label without the stale unavailable message", () => {
  assert.match(studio, /wishes: "Guest Wishes"/);
  assert.match(studio, /\{en \? sectionNamesEnglish\[item\.key\] : item\.title\}/);
  assert.doesNotMatch(studio, /Pengiriman ucapan belum tersedia|Sending wishes is not available yet/);
});

test("all invitation renderers use one shared live wishes engine and previews cannot submit", () => {
  assert.match(universal, /sections\.wishes && section\("wishes", \(/);
  assert.match(universal, /<GuestWishes slug=\{invitation\.slug\} preview=\{preview\}/);
  assert.match(rose, /renderSectionInstances\("wishes", \(instanceId, sectionStyle\) => \(/);
  assert.match(rose, /<GuestWishes slug=\{invitation\.slug\} preview=\{preview\}/);
  assert.doesNotMatch(universal, /Kolom ucapan belum aktif|Ucapan belum tersedia/);
  assert.doesNotMatch(rose, /Kolom ucapan belum aktif/);
  assert.match(component, /if \(preview \|\| submitting \|\| !slug\) return;/);
  assert.match(component, /if \(preview \|\| !slug\) \{/);
  assert.match(component, /<fieldset data-studio-section-element="wishes:input"[\s\S]*?disabled=\{submitting\}[\s\S]*?aria-disabled=\{preview \|\| submitting\}/);
  assert.match(component, /data-studio-section-element="wishes:button"/);
  assert.match(component, /\{!preview && \(/);
  assert.match(component, /maxLength=\{80\}/);
  assert.match(component, /maxLength=\{600\}/);
  assert.match(component, /\{wish\.authorName\}/);
  assert.match(component, /\{wish\.message\}/);
});

test("public wishes are event-scoped and cannot mutate RSVP/Guest or bypass publication and password gates", () => {
  assert.match(schema, /guestWishes\s+GuestWish\[\]/);
  assert.match(schema, /model GuestWish \{/);
  assert.match(schema, /invitationId\s+String/);
  assert.match(schema, /@relation\(fields: \[invitationId\], references: \[id\], onDelete: Cascade\)/);
  assert.match(migration, /CREATE TABLE "GuestWish"/);
  assert.match(migration, /FOREIGN KEY \("invitationId"\) REFERENCES "Invitation"\("id"\) ON DELETE CASCADE/);
  assert.match(route, /!invitation\.eventConfigured/);
  assert.match(route, /!invitation\.isPublished/);
  assert.match(route, /hasPaidDigitalInvitation\(invitation\.payment\)/);
  assert.match(route, /parseInvitationSections\(invitation\.templateKey\)\.wishes === false/);
  assert.match(route, /invitation\.passwordProtected && !\(await hasInvitationAccess\(slug\)\)/);
  assert.match(route, /checkPublicRateLimit\(/);
  assert.match(route, /authorName\.length > NAME_LIMIT/);
  assert.match(route, /wishMessage\.length > MESSAGE_LIMIT/);
  assert.match(route, /where: \{ invitationId: invitation\.id \}/);
  assert.match(route, /data: \{ invitationId: invitation\.id, authorName, message: wishMessage \}/);
  assert.doesNotMatch(route, /prisma\.guest\.(create|upsert|update)/);
  assert.doesNotMatch(route, /prisma\.invitation\.(create|upsert|update)/);
});
