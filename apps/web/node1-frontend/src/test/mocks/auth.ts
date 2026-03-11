import { vi } from "vitest";

import type * as auth from "@/libs/auth";

export const clearAllTokens = vi.fn<typeof auth.clearAllTokens>();
export const getAuthToken = vi.fn<typeof auth.getAuthToken>();
export const getRefreshToken = vi.fn<typeof auth.getRefreshToken>();
export const redirectToLogout = vi.fn<typeof auth.redirectToLogout>();
export const setAuthToken = vi.fn<typeof auth.setAuthToken>();
export const setRefreshToken = vi.fn<typeof auth.setRefreshToken>();
