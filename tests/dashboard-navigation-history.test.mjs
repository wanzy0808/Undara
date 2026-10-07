import assert from "node:assert/strict";
import test from "node:test";
import {
  dashboardHrefForTab,
  dashboardTabFromSearch,
} from "../components/Dashboard/dashboard-navigation.ts";

test("dashboard refresh restores every supported workspace from the URL", () => {
  for (const tab of [
    "overview",
    "profile",
    "events",
    "invitation",
    "waBlast",
    "personalInvitation",
    "rsvp",
    "placement",
    "usher",
  ]) {
    const search = tab === "overview" ? "" : `?tab=${tab}`;
    assert.equal(dashboardTabFromSearch(search), tab);
  }

  assert.equal(dashboardTabFromSearch("?tab=unknown"), "overview");
  assert.equal(dashboardTabFromSearch(""), "overview");
});

test("dashboard navigation writes history-friendly URLs and preserves existing flow params", () => {
  assert.equal(dashboardHrefForTab("placement"), "/dashboard?tab=placement");
  assert.equal(
    dashboardHrefForTab("rsvp", "?tab=placement&from=template&template=botanical-ivory"),
    "/dashboard?tab=rsvp&from=template&template=botanical-ivory",
  );
  assert.equal(
    dashboardHrefForTab("overview", "?tab=placement"),
    "/dashboard",
  );
});
