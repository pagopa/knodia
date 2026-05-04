import type { UserRole } from "@knodia/common-models/auth";

import { notFound } from "@tanstack/react-router";

import type { RouterContext } from "./router";

export function requireRole(context: RouterContext, role: UserRole): void {
  if (!context.auth.roles.includes(role)) {
    throw notFound({ routeId: "/_authenticated" });
  }
}
