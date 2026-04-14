import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";

import { server } from "@/test/msw/server";
import { renderWithProviders, screen, waitFor } from "@/test/utils";

import { EserviceProducerActions } from "./EserviceProducerActions";

const BASE_URL = import.meta.env["BFF_URL"];
const ESERVICE_ID = "00000000-0000-0000-0000-000000000001";

describe("EserviceProducerActions", () => {
  it("renders nothing when the eservice is archived", () => {
    const { container } = renderWithProviders(
      <EserviceProducerActions eserviceId={ESERVICE_ID} state="Archived" />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("shows the Suspend button when the eservice is active and confirms the action", async () => {
    const suspendHandler = vi.fn(() => new HttpResponse(null, { status: 204 }));
    server.use(
      http.post(
        `${BASE_URL}/producer/eservices/:eserviceId/suspend`,
        suspendHandler,
      ),
    );

    const { user } = renderWithProviders(
      <EserviceProducerActions eserviceId={ESERVICE_ID} state="Active" />,
    );

    await user.click(screen.getByRole("button", { name: "Suspend" }));

    expect(await screen.findByText("Suspend E-Service")).toBeInTheDocument();
    expect(
      screen.getByText(
        /Suspending an E-Service causes malfunctioning in all the services that use it/,
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Suspend anyway" }));

    await waitFor(() => {
      expect(suspendHandler).toHaveBeenCalledTimes(1);
    });
  });

  it("does not call the suspend mutation when cancelling the dialog", async () => {
    const suspendHandler = vi.fn(() => new HttpResponse(null, { status: 204 }));
    server.use(
      http.post(
        `${BASE_URL}/producer/eservices/:eserviceId/suspend`,
        suspendHandler,
      ),
    );

    const { user } = renderWithProviders(
      <EserviceProducerActions eserviceId={ESERVICE_ID} state="Active" />,
    );

    await user.click(screen.getByRole("button", { name: "Suspend" }));

    expect(await screen.findByText("Suspend E-Service")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(suspendHandler).not.toHaveBeenCalled();
  });

  it("shows the Reactivate button when the eservice is suspended and calls the mutation", async () => {
    const reactivateHandler = vi.fn(
      () => new HttpResponse(null, { status: 204 }),
    );
    server.use(
      http.post(
        `${BASE_URL}/producer/eservices/:eserviceId/reactivate`,
        reactivateHandler,
      ),
    );

    const { user } = renderWithProviders(
      <EserviceProducerActions eserviceId={ESERVICE_ID} state="Suspended" />,
    );

    expect(
      screen.queryByRole("button", { name: "Suspend" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Reactivate" }));

    await waitFor(() => {
      expect(reactivateHandler).toHaveBeenCalledTimes(1);
    });
  });
});
