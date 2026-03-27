import { isNotFound } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import type { RouterContext } from "./router";

import { requireRole } from "./routeGuards";

function makeContext(
  roles: readonly ("administrative" | "technical")[],
): RouterContext {
  return {
    auth: { isAuthenticated: true, roles },
    queryClient: {} as RouterContext["queryClient"],
  };
}

describe("requireRole", () => {
  it("does not throw when user has the required role", () => {
    expect(() =>
      requireRole(makeContext(["administrative"]), "administrative"),
    ).not.toThrow();
  });

  it("does not throw when user has both roles", () => {
    expect(() =>
      requireRole(
        makeContext(["administrative", "technical"]),
        "administrative",
      ),
    ).not.toThrow();
  });

  it("throws notFound when user lacks the required role", () => {
    try {
      requireRole(makeContext(["technical"]), "administrative");
      expect.fail("Expected requireRole to throw");
    } catch (error) {
      expect(isNotFound(error)).toBe(true);
    }
  });

  it("throws notFound when roles array is empty", () => {
    try {
      requireRole(makeContext([]), "administrative");
      expect.fail("Expected requireRole to throw");
    } catch (error) {
      expect(isNotFound(error)).toBe(true);
    }
  });
});
