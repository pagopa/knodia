import { vi } from "vitest";

import type * as auth from "@/libs/auth";

export const clearAuthToken = vi.fn<typeof auth.clearAuthToken>();
export const getAuthToken = vi.fn<typeof auth.getAuthToken>();
export const redirectToLogout = vi.fn<typeof auth.redirectToLogout>();
export const setAuthToken = vi.fn<typeof auth.setAuthToken>();
export const subscribeToAuthToken = vi.fn<typeof auth.subscribeToAuthToken>(
  () => () => undefined,
);
