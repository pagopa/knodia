import type { bffApi } from "@knodia/bff-client";

import { QueryClient } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { Component, type ReactElement, type ReactNode, Suspense } from "react";
import { describe, expect, it, vi } from "vitest";

import { server } from "@/test/msw/server";
import { renderWithProviders, screen, waitFor } from "@/test/utils";

import { ConsumerAgreementsPage } from "./index";

const BASE_URL = "http://localhost:3000/bff";

const routes = [
  { path: "/consumption/agreements" },
  { path: "/consumption/e-services" },
  { path: "/consumption/e-services/$id" },
  { path: "/consumption/e-services/search" },
  { path: "/consumption/agreements/archive" },
];

const emptyCounters = {
  activeAgreements: 0,
  archivedAgreements: 0,
  suspendedAgreements: 0,
};

function buildPendingAgreement(
  overrides: Partial<bffApi.PendingConsumerAgreement> = {},
): bffApi.PendingConsumerAgreement {
  return {
    eservice: {
      categories: [{ code: "main-address", scheme: "it-national-data" }],
      id: crypto.randomUUID(),
      mode: "ProvideData",
      name: { en: "Vehicle registration details" },
      state: "Active",
    },
    id: crypto.randomUUID(),
    producer: { id: crypto.randomUUID(), knodeId: "Orion", name: "Producer X" },
    ...overrides,
  };
}

function mockCounters(counters: {
  activeAgreements: number;
  archivedAgreements: number;
  suspendedAgreements: number;
}) {
  server.use(
    http.get(`${BASE_URL}/consumer/agreements`, () =>
      HttpResponse.json({ counters }),
    ),
  );
}

function mockPending(body: bffApi.PendingConsumerAgreements | { status: 500 }) {
  server.use(
    http.get(`${BASE_URL}/consumer/agreements/pending`, () => {
      if ("status" in body) {
        return HttpResponse.json(
          { correlationId: "t", status: 500, title: "Internal" },
          { status: 500 },
        );
      }
      return HttpResponse.json(body);
    }),
  );
}

function renderPage({
  offset = 0,
  onOffsetChange = vi.fn(),
  queryClient,
  roles,
  wrapper,
}: {
  offset?: number;
  onOffsetChange?: (offset: number) => void;
  queryClient?: QueryClient;
  roles?: readonly ("administrative" | "technical")[];
  wrapper?: (children: ReactElement) => ReactElement;
} = {}) {
  const page = (
    <Suspense fallback={<div>suspense-fallback</div>}>
      <ConsumerAgreementsPage offset={offset} onOffsetChange={onOffsetChange} />
    </Suspense>
  );

  return renderWithProviders(wrapper ? wrapper(page) : page, {
    queryClient,
    roles,
    routes,
  });
}

describe("ConsumerAgreementsPage", () => {
  it("renders the summary and pending list when there are pending agreements", async () => {
    mockCounters({
      activeAgreements: 3,
      archivedAgreements: 1,
      suspendedAgreements: 2,
    });
    mockPending({
      pagination: { limit: 9, offset: 0, total: 1 },
      results: [buildPendingAgreement()],
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Action needed")).toBeInTheDocument();
    });

    expect(
      screen.getByText("Vehicle registration details"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("No actions are needed."),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("You don't have any Agreements yet."),
    ).not.toBeInTheDocument();
  });

  it("renders the Empty state when there are no agreements (admin sees CTA)", async () => {
    mockCounters(emptyCounters);
    mockPending({
      pagination: { limit: 9, offset: 0, total: 0 },
      results: [],
    });

    renderPage({ roles: ["administrative"] });

    await waitFor(() => {
      expect(
        screen.getByText("You don't have any Agreements yet."),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByRole("button", { name: "Search new E-Services" }),
    ).toBeInTheDocument();
  });

  it("hides the Empty CTA for non-administrative users", async () => {
    mockCounters(emptyCounters);
    mockPending({
      pagination: { limit: 9, offset: 0, total: 0 },
      results: [],
    });

    renderPage({ roles: ["technical"] });

    await waitFor(() => {
      expect(
        screen.getByText("You don't have any Agreements yet."),
      ).toBeInTheDocument();
    });

    expect(
      screen.queryByRole("button", { name: "Search new E-Services" }),
    ).not.toBeInTheDocument();
  });

  it("renders summary + pending list when only pending agreements exist", async () => {
    mockCounters(emptyCounters);
    mockPending({
      pagination: { limit: 9, offset: 0, total: 1 },
      results: [buildPendingAgreement()],
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Action needed")).toBeInTheDocument();
    });

    expect(
      screen.queryByText("You don't have any Agreements yet."),
    ).not.toBeInTheDocument();
  });

  it("resets the offset and never paints 'No actions are needed' when the URL offset is stale", async () => {
    mockCounters(emptyCounters);
    mockPending({
      pagination: { limit: 9, offset: 99, total: 5 },
      results: [],
    });

    const onOffsetChange = vi.fn();
    renderPage({ offset: 99, onOffsetChange });

    await waitFor(() => {
      expect(onOffsetChange).toHaveBeenCalledWith(0);
    });

    expect(
      screen.queryByText("No actions are needed."),
    ).not.toBeInTheDocument();
  });

  it("propagates pending-query failures to the error boundary", async () => {
    mockCounters(emptyCounters);
    mockPending({ status: 500 });

    const errorClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, throwOnError: true },
      },
    });

    renderPage({
      queryClient: errorClient,
      wrapper: (children) => <TestErrorBoundary>{children}</TestErrorBoundary>,
    });

    await waitFor(() => {
      expect(screen.getByText("error-boundary-caught")).toBeInTheDocument();
    });

    expect(
      screen.queryByText("No actions are needed."),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("You don't have any Agreements yet."),
    ).not.toBeInTheDocument();
  });
});

class TestErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  override state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  override render() {
    if (this.state.hasError) {
      return <div>error-boundary-caught</div>;
    }
    return this.props.children;
  }
}
