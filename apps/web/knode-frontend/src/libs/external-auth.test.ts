import { afterEach, describe, expect, it } from "vitest";

import {
  clearExternalToken,
  getExternalToken,
  setExternalToken,
} from "@/libs/external-auth";

describe("external-auth (sessionStorage helpers)", () => {
  afterEach(() => {
    sessionStorage.clear();
  });

  it("returns null when no token is set", () => {
    expect(getExternalToken()).toBeNull();
  });

  it("persists and reads back the token", () => {
    setExternalToken("token-abc");
    expect(getExternalToken()).toBe("token-abc");
  });

  it("overwrites the previous value when set is called again", () => {
    setExternalToken("first");
    setExternalToken("second");
    expect(getExternalToken()).toBe("second");
  });

  it("clears the stored token", () => {
    setExternalToken("token-abc");
    clearExternalToken();
    expect(getExternalToken()).toBeNull();
  });

  it("uses sessionStorage (not localStorage) so the token does not leak across tabs", () => {
    setExternalToken("token-abc");
    expect(localStorage.getItem("knodia_external_ui_session_token")).toBeNull();
    expect(sessionStorage.getItem("knodia_external_ui_session_token")).toBe(
      "token-abc",
    );
  });
});
