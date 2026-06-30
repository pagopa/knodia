import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { OnboardingStatus } from "@/services/onboarding";

import { useOnboardingPublishRecovery } from "./useOnboardingPublishRecovery";

type Props = Parameters<typeof useOnboardingPublishRecovery>[0];

function setup(overrides: Partial<Props> = {}) {
  const republish = vi.fn();
  const initialProps: Props = {
    email: "test@example.com",
    enabled: true,
    onboardingStatus: "ONBOARDING_PENDING",
    republish,
    ...overrides,
  };
  const { rerender } = renderHook(
    (props: Props) => useOnboardingPublishRecovery(props),
    { initialProps },
  );
  return { initialProps, republish, rerender };
}

describe("useOnboardingPublishRecovery", () => {
  it("re-issues the confirm once when the page loads already pending", () => {
    const { republish } = setup();
    expect(republish).toHaveBeenCalledExactlyOnceWith("test@example.com");
  });

  it("does not fire again while the status stays pending", () => {
    const { initialProps, republish, rerender } = setup();
    rerender({ ...initialProps });
    rerender({ ...initialProps });
    expect(republish).toHaveBeenCalledOnce();
  });

  it.each([
    "ACTIVE",
    "NOT_COMPLETED",
    "SUSPENDED",
    "DELETION_PENDING",
  ] as const satisfies OnboardingStatus[])(
    "does not fire for %s",
    (onboardingStatus) => {
      const { republish } = setup({ onboardingStatus });
      expect(republish).not.toHaveBeenCalled();
    },
  );

  it("does not fire while the user is submitting the form themselves", () => {
    const { republish } = setup({ enabled: false });
    expect(republish).not.toHaveBeenCalled();
  });

  it("does not fire without an email to resubmit", () => {
    const { republish } = setup({ email: undefined });
    expect(republish).not.toHaveBeenCalled();
  });
});
