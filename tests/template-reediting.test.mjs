import assert from "node:assert/strict";
import test from "node:test";
import * as React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import { Button } from "../components/ui/button.tsx";
import StudioCanvasToolbarModule from "../components/InvitationStudio/StudioCanvasToolbar.tsx";
import * as catalog from "../lib/templates/catalog.ts";
import * as design from "../lib/templates/design.ts";
import * as editing from "../lib/templates/template-editing.ts";
import { loadSource } from "./helpers/package-access.mjs";

const author = { id: "designer-a", role: "DESIGNER" };
const StudioCanvasToolbar = StudioCanvasToolbarModule.default ?? StudioCanvasToolbarModule;
const saved = (overrides = {}) => ({
  id: "saved-template", templateNo: "027", designerId: author.id, status: "DRAFT",
  name: "Saved design", designKey: "botanical-ivory::botanical::rufinaAverage",
  previewUrl: "/templates/botanical-ivory/preview.svg", tags: [], category: "Botanical",
  templateFile: null, customInvitationId: null, customInvitation: null,
  designer: { id: author.id, firstName: "Designer", lastName: null, email: "designer@example.test" },
  ...overrides,
});
const payload = { id: "saved-template", designKey: "botanical-ivory::pearl::cinzelFauna", name: "Repaired design" };
const origin = loadSource("lib/security/request-origin.ts", {}, {
  env: { APP_URL: "https://example.test", NODE_ENV: "production" },
});

// Load the actual route, retaining production parsing, renderer lookup and origin validation.
// Replace only authentication/database boundaries; reject unintended customer/template creation writes.
function fixture({ user = author, row = saved(), rows, beforeUpdate } = {}) {
  const calls = { reads: [], lists: [], updates: [] };
  let current = row && { ...row };
  const matches = (item, where) => Boolean(item && (!where.id || item.id === where.id)
    && (!where.designerId || item.designerId === where.designerId)
    && (!where.status || (typeof where.status === "string" ? item.status === where.status : where.status.in.includes(item.status))));
  const forbiddenWrite = async () => { assert.fail("Editing a template must not create a template/version or write a customer invitation"); };
  const prisma = {
    designerTemplate: {
      findFirst: async ({ where }) => { calls.reads.push(where); return matches(current, where) ? { ...current } : null; },
      findMany: async ({ where }) => { calls.lists.push(where); return (rows ?? [current]).filter((item) => matches(item, where)); },
      update: async (query) => {
        calls.updates.push(query);
        if (beforeUpdate) current = beforeUpdate(current);
        if (!matches(current, query.where)) throw Object.assign(new Error("No matching template"), { code: "P2025" });
        current = { ...current, ...query.data };
        return { ...current };
      },
      create: forbiddenWrite,
    },
    invitation: { update: forbiddenWrite, updateMany: forbiddenWrite, create: forbiddenWrite },
    paymentOrder: { findMany: async () => [] },
  };
  const route = loadSource("app/api/designer/templates/route.ts", {
    "next/server": { NextResponse: { json: (data, init) => Response.json(data, init) } },
    "@/lib/auth": { getCurrentUser: async () => user },
    "@/lib/prisma": { prisma },
    "@/lib/templates/catalog": catalog,
    "@/lib/templates/design": design,
    "@/lib/templates/template-editing": editing,
    "@/lib/security/request-origin": origin,
  });
  return { route, calls, current: () => current };
}

function patch(body = payload, headers = {}) {
  return new Request("https://example.test/api/designer/templates", {
    method: "PATCH", headers: { "Content-Type": "application/json", Origin: "https://example.test", ...headers },
    body: JSON.stringify(body),
  });
}

test("saved-template policy allows all three working statuses and closes archived/unknown records", () => {
  for (const status of ["DRAFT", "REVIEW", "PUBLISHED"]) assert.equal(editing.isEditableTemplateStatus(status), true);
  for (const status of ["ARCHIVED", "OTHER", "", null, undefined]) assert.equal(editing.isEditableTemplateStatus(status), false);
});

for (const status of ["DRAFT", "REVIEW", "PUBLISHED"]) {
  test(`actual PATCH edits an owned ${status} template in place and preserves its status`, async () => {
    const { route, calls } = fixture({ row: saved({ status }) });
    const response = await route.PATCH(patch({ ...payload, status: "PUBLISHED", designerId: "intruder" }));
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.equal(data.template.id, payload.id);
    assert.equal(data.template.templateNo, "027");
    assert.equal(data.template.status, status);
    assert.equal(data.template.designerId, author.id);
    assert.equal(data.template.name, payload.name);
    assert.equal(data.template.designKey, payload.designKey);
    assert.equal(data.ready, status === "PUBLISHED");
    assert.equal(calls.updates.length, 1);
    assert.equal(calls.updates[0].where.id, payload.id);
    assert.equal(Object.hasOwn(calls.updates[0].data, "status"), false);
  });
}

test("Owner/Admin can repair another author's saved template; Designer/Editor remain scoped to their own", async () => {
  for (const role of ["OWNER", "ADMIN"]) {
    const { route, calls } = fixture({ user: { id: "reviewer", role }, row: saved({ status: "PUBLISHED" }) });
    assert.equal((await route.PATCH(patch())).status, 200);
    assert.equal(Object.hasOwn(calls.updates[0].where, "designerId"), false);
  }
  for (const role of ["DESIGNER", "EDITOR"]) {
    const own = fixture({ user: { ...author, role } });
    assert.equal((await own.route.PATCH(patch())).status, 200);
    assert.equal(own.calls.updates[0].where.designerId, author.id);
    const other = fixture({ user: { id: "another-designer", role } });
    assert.equal((await other.route.PATCH(patch())).status, 404);
    assert.equal(other.calls.updates.length, 0);
  }
});

test("unauthenticated/customer and untrusted origin requests cannot edit saved templates", async () => {
  for (const user of [null, { id: "user-a", role: "USER" }]) {
    const { route, calls } = fixture({ user });
    assert.equal((await route.PATCH(patch())).status, 403);
    assert.equal(calls.reads.length, 0);
  }
  for (const Origin of ["https://other.test", ""]) {
    const { route, calls } = fixture();
    assert.equal((await route.PATCH(patch(payload, { Origin }))).status, 403);
    assert.equal(calls.updates.length, 0);
  }
});

test("archived templates and custom jobs reject Save even for Owner", async () => {
  for (const customInvitationId of [null, "customer-event"]) {
    const { route, calls } = fixture({ user: { id: "owner", role: "OWNER" }, row: saved({ status: "ARCHIVED", customInvitationId }) });
    assert.equal((await route.PATCH(patch())).status, 409);
    assert.equal(calls.updates.length, 0);
  }
});

test("the atomic Save filter blocks a custom job archived or reassigned after loading", async () => {
  for (const beforeUpdate of [
    (row) => ({ ...row, status: "ARCHIVED" }),
    (row) => ({ ...row, designerId: "new-assignee" }),
  ]) {
    const { route, current } = fixture({ row: saved({ customInvitationId: "customer-event" }), beforeUpdate });
    assert.equal((await route.PATCH(patch())).status, 409);
    assert.notEqual(current().name, payload.name);
    assert.notEqual(current().designKey, payload.designKey);
  }
});

test("Save preserves a Review/Published transition made while the editor was open", async () => {
  for (const status of ["REVIEW", "PUBLISHED"]) {
    const { route } = fixture({ beforeUpdate: (row) => ({ ...row, status }) });
    const response = await route.PATCH(patch());
    assert.equal(response.status, 200);
    assert.equal((await response.json()).template.status, status);
  }
});

test("editing does not bypass first-publication review or publish bound customer jobs", async () => {
  const cases = [
    { user: author, status: "REVIEW", expected: 403 },
    { user: { id: "owner", role: "OWNER" }, status: "DRAFT", expected: 409 },
    { user: { id: "owner", role: "OWNER" }, status: "REVIEW", customInvitationId: "customer-event", expected: 409 },
    { user: { id: "owner", role: "OWNER" }, status: "REVIEW", expected: 200 },
  ];
  for (const { user, status, customInvitationId, expected } of cases) {
    const { route, calls } = fixture({ user, row: saved({ status, customInvitationId }) });
    const response = await route.PATCH(patch({ id: payload.id, action: "PUBLISH" }));
    assert.equal(response.status, expected);
    assert.equal(calls.updates.length, expected === 200 ? 1 : 0);
    if (expected === 200) assert.equal((await response.json()).template.status, "PUBLISHED");
  }
});

test("Owner/Admin saved-template lists include published and other authors' drafts without archived jobs", async () => {
  const rows = ["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"].map((status) => saved({ id: status, status }));
  for (const role of ["OWNER", "ADMIN"]) {
    const { route } = fixture({ user: { id: "reviewer", role }, rows });
    const response = await route.GET(new Request("https://example.test/api/designer/templates?scope=review"));
    assert.equal(response.status, 200);
    assert.deepEqual((await response.json()).templates.map((row) => row.id), ["DRAFT", "REVIEW", "PUBLISHED"]);
  }
  const { route, calls } = fixture();
  assert.equal((await route.GET(new Request("https://example.test/api/designer/templates?scope=review"))).status, 403);
  assert.equal(calls.lists.length, 0);
});

test("reopening remains author-scoped and closed custom jobs expose no customer media", async () => {
  const url = new Request(`https://example.test/api/designer/templates?id=${payload.id}`);
  assert.equal((await fixture({ user: { id: "other", role: "DESIGNER" } }).route.GET(url)).status, 404);
  for (const status of ["REVIEW", "PUBLISHED", "ARCHIVED"]) {
    const customer = { id: "customer-event", assets: [{ url: "/private/customer.webp" }] };
    const { route } = fixture({ row: saved({ status, customInvitationId: customer.id, customInvitation: customer }) });
    const response = await route.GET(url);
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.equal(data.template.isCustom, true);
    assert.deepEqual(data.template.customInvitation, status === "REVIEW" ? customer : null);
    assert.equal(Object.hasOwn(data.template, "customInvitationId"), false);
  }
});

function dashboard(path, rows) {
  let stateIndex = 0;
  const states = path.includes("Designer/") ? [rows] : [rows, [], []];
  const component = loadSource(path, {
    react: { ...React, useState: (initial) => [Object.hasOwn(states, stateIndex) ? states[stateIndex++] : (stateIndex++, initial), () => {}], useEffect: () => {}, useMemo: (fn) => fn() },
    "react/jsx-runtime": jsxRuntime,
    "next/link": { __esModule: true, default: ({ children, ...props }) => React.createElement("a", props, children) },
    "@/components/ui/button": { Button },
    "@/lib/templates/template-editing": editing,
  }).default;
  return renderToStaticMarkup(React.createElement(component));
}

test("actual Owner and Designer cards reopen all saved editable designs, including legacy file + design records", () => {
  const rows = ["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"].map((status) => saved({ id: `${status}/saved`, status }));
  rows.push(saved({ id: "image-only", designKey: null, templateFile: "/uploads/template.png", status: "PUBLISHED" }));
  rows.push(saved({ id: "file-and-design", templateFile: "/uploads/template.zip", status: "PUBLISHED" }));
  for (const role of ["Owner", "Designer"]) {
    const html = dashboard(`components/${role}/${role === "Owner" ? "OwnerTemplateReview" : "DesignerDashboard"}.tsx`, rows);
    for (const status of ["DRAFT", "REVIEW", "PUBLISHED"]) assert.ok(html.includes(`/${role.toLowerCase()}/studio?draft=${status}%2Fsaved`));
    assert.ok(html.includes(`/${role.toLowerCase()}/studio?draft=file-and-design`));
    assert.ok(!html.includes("draft=ARCHIVED%2Fsaved"));
    assert.ok(!html.includes("draft=image-only"));
  }
});

test("actual toolbar uses Simpan/Save for existing templates and disables only clean/busy/unready saves", () => {
  const props = {
    locale: "id", inspectorOpen: true, templateName: "Saved", invitationReady: true,
    saving: false, audioBusy: false, canUndo: false, canRedo: false, templateMode: true, dirty: true,
    labels: { save: "Simpan", saving: "Menyimpan..." },
  };
  for (const locale of ["id", "en"]) {
    const save = locale === "id" ? "Simpan" : "Save";
    const render = (overrides) => renderToStaticMarkup(React.createElement(StudioCanvasToolbar, { ...props, locale, labels: { ...props.labels, save }, ...overrides }));
    assert.match(render({ savedTemplate: false }), new RegExp(`${save} Draft<`));
    const existing = render({ savedTemplate: true });
    assert.ok(!existing.includes(`${save} Draft`));
    const saveButton = existing.match(/<button\b[^>]*>[\s\S]*?<\/button>/g).at(-1);
    assert.ok(!saveButton.includes("disabled="));
    assert.match(saveButton, new RegExp(`${save}</button>$`));
    for (const flags of [{ dirty: false }, { saving: true }, { audioBusy: true }, { invitationReady: false }]) {
      const html = render({ savedTemplate: true, ...flags });
      const button = html.match(/<button\b[^>]*>[\s\S]*?<\/button>/g).at(-1);
      assert.match(button, /disabled=""/);
    }
  }
});
