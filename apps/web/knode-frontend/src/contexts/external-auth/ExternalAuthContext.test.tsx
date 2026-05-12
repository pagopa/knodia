import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  clearExternalToken,
  getExternalToken,
  setExternalToken,
} from "@/libs/external-auth";

import { ExternalAuthProvider } from "./ExternalAuthContext";
import { useExternalAuth } from "./useExternalAuth";

function ExternalAuthConsumer({
  onAuth,
}: {
  onAuth: (auth: ReturnType<typeof useExternalAuth>) => void;
}) {
  const auth = useExternalAuth();
  onAuth(auth);
  return null;
}

function renderWithProvider(
  onAuth: (auth: ReturnType<typeof useExternalAuth>) => void,
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ExternalAuthProvider>
        <ExternalAuthConsumer onAuth={onAuth} />
      </ExternalAuthProvider>
    </QueryClientProvider>,
  );
}

describe("ExternalAuthContext", () => {
  afterEach(() => {
    sessionStorage.clear();
  });

  it("initializes the token from sessionStorage on mount", () => {
    setExternalToken("preexisting-token");
    const onAuth = vi.fn();
    renderWithProvider(onAuth);
    expect(onAuth.mock.calls.at(-1)?.[0].token).toBe("preexisting-token");
  });

  it("acceptSession persists the token and exposes it via the context", () => {
    const onAuth = vi.fn();
    renderWithProvider(onAuth);
    expect(onAuth.mock.calls.at(-1)?.[0].token).toBeNull();

    act(() => onAuth.mock.calls.at(-1)?.[0].acceptSession("new-token"));
    expect(onAuth.mock.calls.at(-1)?.[0].token).toBe("new-token");
    expect(getExternalToken()).toBe("new-token");
  });

  it("endSession clears the token in both React state and sessionStorage", () => {
    const onAuth = vi.fn();
    renderWithProvider(onAuth);

    act(() => onAuth.mock.calls.at(-1)?.[0].acceptSession("token-abc"));
    act(() => onAuth.mock.calls.at(-1)?.[0].endSession());
    expect(onAuth.mock.calls.at(-1)?.[0].token).toBeNull();
    expect(getExternalToken()).toBeNull();
  });

  it("reflects external token clears made outside React (e.g. router beforeLoad)", () => {
    setExternalToken("preexisting-token");
    const onAuth = vi.fn();
    renderWithProvider(onAuth);
    expect(onAuth.mock.calls.at(-1)?.[0].token).toBe("preexisting-token");

    act(() => {
      clearExternalToken();
    });

    expect(onAuth.mock.calls.at(-1)?.[0].token).toBeNull();
    expect(getExternalToken()).toBeNull();
  });

  it("throws when useExternalAuth is used without the provider", () => {
    function Bare() {
      useExternalAuth();
      return null;
    }
    expect(() => render(<Bare />)).toThrowError(
      /must be used within ExternalAuthProvider/,
    );
  });
});
