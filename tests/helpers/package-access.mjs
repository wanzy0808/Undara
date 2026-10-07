import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
import * as paidAccess from "../../lib/packages/access.ts";

export function loadSource(path, modules, { env = {}, errors = [] } = {}) {
  const source = readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const sourceModule = { exports: {} };
  new Function("require", "exports", "module", "process", "console", compiled)((id) => {
    assert.ok(Object.hasOwn(modules, id), `Unexpected access dependency: ${id}`);
    return modules[id];
  }, sourceModule.exports, sourceModule, { env }, { error: (...args) => errors.push(args) });
  return sourceModule.exports;
}

// Keep the production payment/grant parsers and server entitlement helper;
// replace only the database boundary with the user's latest audit metadata.
export function loadPackageAccess({ grants = {}, grantError, invitations = {} } = {}) {
  const queries = [];
  const assignmentLogs = [];
  const prisma = {
    auditLog: {
      findFirst: async (query) => {
        queries.push(query);
        if (grantError) throw grantError;
        const metadata = grants[query.where.entityId];
        return metadata === undefined ? null : { metadata };
      },
      findMany: async (query) => assignmentLogs
        .filter((entry) => entry.entityId === query.where.entityId && entry.action === query.where.action)
        .map((entry) => ({ metadata: entry.metadata })),
      create: async (query) => {
        assignmentLogs.push(query.data);
        return query.data;
      },
    },
    invitation: { findMany: async (query) => {
      const ownerId = query.where.ownerId;
      return invitations[ownerId] ?? [{ id: "invitation-a", payment: null }];
    } },
    payment: { findFirst: async () => {
      throw new Error("Digital Invitation must not inherit another event's payment");
    } },
  };
  const ownerGrants = loadSource("lib/packages/owner-grants.ts", {
    "@/lib/prisma": { prisma },
    "@/lib/packages/access": paidAccess,
  });
  const access = loadSource("lib/packages/server-access.ts", {
    "@/lib/prisma": { prisma },
    "@/lib/packages/access": paidAccess,
    "@/lib/packages/owner-grants": ownerGrants,
  });
  return { access, queries };
}
