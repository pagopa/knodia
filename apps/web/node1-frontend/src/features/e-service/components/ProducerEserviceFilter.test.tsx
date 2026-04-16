import { type EserviceId, unsafeBrandId } from "@knodia/common-models/ids";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";

import { server } from "@/test/msw/server";
import { renderWithProviders, screen } from "@/test/utils";

import { ProducerEserviceFilter } from "./ProducerEserviceFilter";

const BASE_URL = import.meta.env["BFF_URL"];

const eserviceA = {
  categories: [],
  id: "10000000-0000-1000-8000-000000000001",
  mode: "ProvideData" as const,
  name: { en: "Birth Certificate API" },
  state: "Active" as const,
};

function mockEserviceOptions() {
  server.use(
    http.get(`${BASE_URL}/producer/eservices`, () =>
      HttpResponse.json({
        pagination: { limit: 50, offset: 0, total: 1 },
        results: [eserviceA],
      }),
    ),
  );
}

const noop = vi.fn();

function renderFilter({
  eserviceId,
  onEserviceIdChange = noop,
}: {
  eserviceId?: EserviceId;
  onEserviceIdChange?: (id: EserviceId | undefined) => void;
} = {}) {
  return renderWithProviders(
    <ProducerEserviceFilter
      eserviceId={eserviceId}
      onEserviceIdChange={onEserviceIdChange}
    />,
  );
}

describe("ProducerEserviceFilter", () => {
  it("renders with placeholder when no eservice is selected", () => {
    renderFilter();

    expect(screen.getByPlaceholderText("All E-Service")).toBeInTheDocument();
    expect(screen.getByText("E-Service")).toBeInTheDocument();
  });

  it("renders combobox input", () => {
    renderFilter();

    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("shows selected e-service label on deep link", async () => {
    mockEserviceOptions();
    renderFilter({
      eserviceId: unsafeBrandId<EserviceId>(eserviceA.id),
    });

    expect(
      await screen.findByDisplayValue("Birth Certificate API"),
    ).toBeInTheDocument();
  });

  it("shows empty input when eserviceId is set but options have not loaded yet", () => {
    renderFilter({
      eserviceId: unsafeBrandId<EserviceId>(eserviceA.id),
    });

    expect(screen.getByRole("combobox")).toHaveValue("");
  });
});
