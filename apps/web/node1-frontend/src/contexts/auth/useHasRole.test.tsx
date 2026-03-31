import { describe, expect, it } from "vitest";

import { renderWithProviders } from "@/test/utils";

import { useHasRole } from "./useHasRole";

function renderUseHasRole(
  role: "administrative" | "technical",
  roles: readonly ("administrative" | "technical")[],
) {
  // Use renderWithProviders to set up AuthContext, then renderHook inside the wrapper
  let result: boolean | undefined;
  renderWithProviders(
    <TestComponent
      onResult={(r) => {
        result = r;
      }}
      role={role}
    />,
    { roles },
  );
  return result;
}

function TestComponent({
  onResult,
  role,
}: {
  onResult: (result: boolean) => void;
  role: "administrative" | "technical";
}) {
  const hasRole = useHasRole(role);
  onResult(hasRole);
  return null;
}

describe("useHasRole", () => {
  it("returns true when user has the requested role", () => {
    expect(renderUseHasRole("administrative", ["administrative"])).toBe(true);
  });

  it("returns false when user does not have the requested role", () => {
    expect(renderUseHasRole("administrative", ["technical"])).toBe(false);
  });

  it("returns true when user has both roles", () => {
    expect(renderUseHasRole("technical", ["administrative", "technical"])).toBe(
      true,
    );
  });

  it("returns false when roles array is empty", () => {
    expect(renderUseHasRole("administrative", [])).toBe(false);
  });
});
