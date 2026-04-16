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

const eserviceB = {
  categories: [],
  id: "20000000-0000-1000-8000-000000000002",
  mode: "ProvideData" as const,
  name: { en: "Tax Service" },
  state: "Active" as const,
};

function mockEserviceOptions() {
  server.use(
    http.get(`${BASE_URL}/producer/eservices`, () =>
      HttpResponse.json({
        pagination: { limit: 50, offset: 0, total: 2 },
        results: [eserviceA, eserviceB],
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

  it("loads and displays e-service options", async () => {
    mockEserviceOptions();
    const { user } = renderFilter();

    const input = screen.getByRole("combobox");
    await user.click(input);

    expect(
      await screen.findByText("Birth Certificate API"),
    ).toBeInTheDocument();
    expect(screen.getByText("Tax Service")).toBeInTheDocument();
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

  it("filters options when typing", async () => {
    mockEserviceOptions();
    const { user } = renderFilter();

    const input = screen.getByRole("combobox");
    await user.click(input);
    await screen.findByText("Birth Certificate API");

    await user.clear(input);
    await user.type(input, "Tax");

    expect(screen.getByText("Tax Service")).toBeInTheDocument();
    expect(screen.queryByText("Birth Certificate API")).not.toBeInTheDocument();
  });

  it("calls onEserviceIdChange when selecting an option", async () => {
    mockEserviceOptions();
    const onChange = vi.fn();
    const { user } = renderFilter({ onEserviceIdChange: onChange });

    const input = screen.getByRole("combobox");
    await user.click(input);

    const option = await screen.findByText("Tax Service");
    await user.click(option);

    expect(onChange).toHaveBeenCalledWith(
      unsafeBrandId<EserviceId>(eserviceB.id),
    );
  });

  it("calls onEserviceIdChange with undefined when clearing", async () => {
    mockEserviceOptions();
    const onChange = vi.fn();
    const { user } = renderFilter({
      eserviceId: unsafeBrandId<EserviceId>(eserviceA.id),
      onEserviceIdChange: onChange,
    });

    const clearButton = await screen.findByLabelText("Clear selection");
    await user.click(clearButton);

    expect(onChange).toHaveBeenCalledWith(undefined);
  });
});
