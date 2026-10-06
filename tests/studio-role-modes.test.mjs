import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (name) => readFileSync(new URL(`../${name}`, import.meta.url), "utf8");

test("Owner and Designer use the shared Studio in Template Mode", () => {
  const owner = read("app/owner/studio/page.tsx");
  const designer = read("app/designer/studio/page.tsx");
  const editorPage = read("components/InvitationStudio/InvitationEditorPage.tsx");
  const editor = read("components/InvitationStudio/InvitationDesigner.tsx");

  assert.match(owner, /<InvitationEditorPage mode="template" backHref="\/owner"/);
  assert.match(designer, /<InvitationEditorPage mode="template" backHref="\/designer"/);
  assert.match(editorPage, /mode\?: "invitation" \| "template"/);
  assert.match(editorPage, /<InvitationDesigner mode=\{mode\}/);
  assert.match(editor, /const templateMode = mode === "template"/);
  assert.match(editor, /getTemplateDemoInvitation\(loadedDesign.template\)/);
});

test("staff Save creates a draft template while customer Save stays event-scoped", () => {
  const editor = read("components/InvitationStudio/InvitationDesigner.tsx");
  const templateApi = read("app/api/designer/templates/route.ts");
  const invitationApi = read("app/api/invitations/route.ts");
  const persistence = read("components/InvitationStudio/designer-persistence.ts");
  const toolbar = read("components/InvitationStudio/StudioCanvasToolbar.tsx");

  assert.match(editor, /if \(templateMode\)/);
  assert.match(editor, /saveStudioTemplateDraft\(/);
  assert.match(persistence, /fetcher\("\/api\/designer\/templates"/);
  assert.match(persistence, /method: templateId \? "PATCH" : "POST"/);
  assert.match(editor, /loadStudioTemplateDraft\(requestedDraftId\)/);
  assert.match(editor, /setTemplateDraftId\(savedTemplate\.id\)/);
  assert.match(editor, /location\.searchParams\.set\("draft", savedTemplate\.id\)/);
  assert.match(toolbar, /Simpan Draft/);
  assert.match(editor, /saveStudioInvitation\(/);
  assert.match(persistence, /fetcher\("\/api\/invitations", \{[\s\S]*?method: "PUT"/);
  assert.match(templateApi, /\["OWNER", "ADMIN", "DESIGNER", "EDITOR"\]\.includes\(user\.role\)/);
  assert.match(templateApi, /designKey,/);
  assert.match(templateApi, /export async function PATCH\(request: Request\)/);
  assert.match(templateApi, /isEditableTemplateStatus\(current\.status\)/);
  assert.match(templateApi, /status: "DRAFT"/);
  assert.match(templateApi, /ready: false/);
  assert.doesNotMatch(templateApi, /prisma\.invitation\.update/);
  assert.match(invitationApi, /isPublished: wantsPublish \|\| current\.isPublished/);
});

test("only published Studio-authored templates appear in the public catalog", () => {
  const schema = read("prisma/schema.prisma");
  const migration = read("prisma/migrations/20260925152000_designer_template_studio_preset/migration.sql");
  const catalog = read("app/api/templates/route.ts");
  const card = read("components/Templates/TemplateGalleryCanvas.tsx");
  const panel = read("components/InvitationStudio/TemplatePanel.tsx");

  assert.match(schema, /designKey\s+String\?\s+@db\.Text/);
  assert.match(schema, /templateFile\s+String\?/);
  assert.match(migration, /ADD COLUMN "designKey" TEXT/);
  assert.match(catalog, /where: \{ status: "PUBLISHED" \}/);
  assert.match(catalog, /const ready = Boolean\(item\.designKey/);
  assert.match(catalog, /designKey: item\.designKey \?\? undefined/);
  assert.match(card, /designKey\?: string/);
  assert.match(panel, /designKey=\{item\.designKey\}/);
});

test("staff cannot accidentally use the customer invitation save route", () => {
  const customerRoute = read("app/dashboard/editor/page.tsx");
  const ownerDashboard = read("components/Owner/OwnerDashboard.tsx");
  const designerDashboard = read("components/Designer/DesignerDashboard.tsx");

  assert.match(customerRoute, /user\.role === "OWNER"\) redirect\("\/owner\/studio"\)/);
  assert.match(customerRoute, /user\.role === "DESIGNER" \|\| user\.role === "EDITOR"/);
  assert.match(ownerDashboard, /href="\/owner\/studio"/);
  assert.match(designerDashboard, /href="\/designer\/studio"/);
});


test("template catalog publication is gated by review and Owner/Admin approval", () => {
  const schema = read("prisma/schema.prisma");
  const migration = read("prisma/migrations/20260927114500_designer_template_review_status/migration.sql");
  const templateApi = read("app/api/designer/templates/route.ts");
  const designerDashboard = read("components/Designer/DesignerDashboard.tsx");
  const ownerDashboard = read("components/Owner/OwnerDashboard.tsx");
  const ownerReview = read("components/Owner/OwnerTemplateReview.tsx");

  assert.match(schema, /enum TemplateStatus \{[\s\S]*DRAFT[\s\S]*REVIEW[\s\S]*PUBLISHED/);
  assert.match(schema, /status\s+TemplateStatus\s+@default\(DRAFT\)/);
  assert.match(migration, /ALTER TYPE "TemplateStatus" ADD VALUE IF NOT EXISTS 'REVIEW'/);
  assert.match(templateApi, /action === "SUBMIT_REVIEW"/);
  assert.match(templateApi, /data: \{ status: "REVIEW" \}/);
  assert.match(templateApi, /action === "PUBLISH"/);
  assert.match(templateApi, /Hanya Owner\/Admin yang dapat mempublikasikan template/);
  assert.match(templateApi, /data: \{ status: "PUBLISHED" \}/);
  assert.match(templateApi, /action === "RETURN_DRAFT"/);
  assert.match(designerDashboard, /Kirim ke Owner/);
  assert.match(read("components/InvitationStudio/InvitationDesigner.tsx"), /isEditableTemplateStatus\(templateDraftStatus\)/);
  assert.match(designerDashboard, /action: "SUBMIT_REVIEW"/);
  assert.match(ownerDashboard, /<OwnerTemplateReview \/>/);
  assert.match(ownerReview, /scope=review/);
  assert.match(ownerReview, /Publish ke Katalog/);
  assert.match(ownerReview, /Kembalikan Draft/);
});
