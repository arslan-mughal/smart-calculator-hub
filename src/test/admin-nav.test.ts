import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";
import { routeTree } from "@/routeTree.gen";
import { ADMIN_NAV } from "@/components/admin-shell";

// Every sidebar item must resolve to a real route (not the 404 fallback).
describe("Admin sidebar navigation", () => {
  it.each(ADMIN_NAV.map((item) => [item.label, item.to] as const))(
    "%s (%s) matches a route",
    (_label, to) => {
      const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
      const matches = router.matchRoutes(to);
      expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
    },
  );

  it("covers the expected sections", () => {
    expect(ADMIN_NAV.map((i) => i.to)).toEqual([
      "/admin",
      "/admin/tools",
      "/admin/blog",
      "/admin/settings",
      "/admin/security",
      "/admin/usage",
    ]);
  });
});
