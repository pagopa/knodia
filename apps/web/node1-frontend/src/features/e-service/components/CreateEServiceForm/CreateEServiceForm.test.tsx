import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";

import { server } from "@/test/msw/server";
import { renderWithProviders, screen, waitFor } from "@/test/utils";

import { CreateEServiceForm } from "./CreateEServiceForm";

const BASE_URL = "http://localhost:3000/bff";

/** Helper: select first attribute on AttributesStep and click Next */
async function fillAttributesStep(
  user: ReturnType<typeof renderWizard>["user"],
) {
  const attrSelect = screen.getByRole("button", { name: /attributes/i });

  await user.click(attrSelect);
  await waitFor(() => {
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });
  const firstOption = screen.getAllByRole("option")[0];
  expect(firstOption).toBeDefined();
  await user.click(firstOption as HTMLElement);

  // Close multi-select dropdown before interacting with the form
  await user.keyboard("{Escape}");
  await waitFor(() => {
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  await user.click(screen.getByRole("button", { name: "Next" }));
  await waitFor(() => {
    expect(screen.getByRole("heading", { name: "Recap" })).toBeInTheDocument();
  });
}

/** Helper: upload file on DocsStep and click Next */
async function fillDocsStep(user: ReturnType<typeof renderWizard>["user"]) {
  const file = new File(['{"openapi":"3.0.0"}'], "spec.json", {
    type: "application/json",
  });
  const fileInput = document.querySelector("input[type='file']");
  expect(fileInput).toBeTruthy();
  await user.upload(fileInput as HTMLInputElement, file);

  await user.click(screen.getByRole("button", { name: "Next" }));
  await waitFor(() => {
    expect(
      screen.getByRole("heading", { name: "Attributes" }),
    ).toBeInTheDocument();
  });
}

/** Helper: fill GeneralStep and click Next */
async function fillGeneralStep(user: ReturnType<typeof renderWizard>["user"]) {
  await user.type(screen.getByLabelText("Name"), "My Test E-Service");
  await user.type(
    screen.getByLabelText("Description"),
    "A complete test description for the e-service",
  );
  await user.click(screen.getByRole("button", { name: "Next" }));
  await waitFor(() => {
    expect(screen.getByText("Technical details")).toBeInTheDocument();
  });
}

/** Helper: fill TechnicalStep and click Next */
async function fillTechnicalStep(
  user: ReturnType<typeof renderWizard>["user"],
) {
  // React Aria NumberField renders <input type="text"> (implicit "textbox" role)
  const durationInput = await screen.findByRole("textbox", {
    name: "Duration (in minutes)",
  });
  await user.clear(durationInput);
  await user.type(durationInput, "60");

  await user.type(screen.getByLabelText("Audience"), "https://api.test.com");

  const perKnodeInput = await screen.findByRole("textbox", {
    name: "Per Knode",
  });
  await user.clear(perKnodeInput);
  await user.type(perKnodeInput, "1000");

  const perConsumerInput = await screen.findByRole("textbox", {
    name: "Per consumer",
  });
  await user.clear(perConsumerInput);
  await user.type(perConsumerInput, "100");

  await user.click(screen.getByRole("button", { name: "Next" }));
  expect(
    await screen.findByRole("heading", { name: "Documents" }),
  ).toBeInTheDocument();
}

function renderWizard(onLeave = vi.fn()) {
  return {
    onLeave,
    ...renderWithProviders(<CreateEServiceForm onLeave={onLeave} />, {
      routes: [{ path: "/production/e-services/$id" }],
    }),
  };
}

describe("CreateEServiceForm", () => {
  it("renders the wizard with GeneralStep as first step", () => {
    renderWizard();

    expect(screen.getByText("General Information")).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Description")).toBeInTheDocument();
  });

  it("navigates through all steps and back preserving data", async () => {
    const { user } = renderWizard();

    await fillGeneralStep(user);

    expect(
      await screen.findByRole("textbox", { name: "Duration (in minutes)" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Audience")).toBeInTheDocument();

    // Go back to General
    await user.click(screen.getByRole("button", { name: "Previous" }));
    await waitFor(() => {
      expect(screen.getByText("General Information")).toBeInTheDocument();
    });

    // Data should be preserved
    expect(screen.getByLabelText("Name")).toHaveValue("My Test E-Service");
    expect(screen.getByLabelText("Description")).toHaveValue(
      "A complete test description for the e-service",
    );
  });
});

describe("CreateEServiceForm — step validation", () => {
  it("blocks navigation when GeneralStep fields are invalid", async () => {
    const { user } = renderWizard();

    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByText("General Information")).toBeInTheDocument();
    expect(screen.queryByText("Technical details")).not.toBeInTheDocument();
  });

  it("blocks navigation when TechnicalStep fields are invalid", async () => {
    const { user } = renderWizard();

    await fillGeneralStep(user);

    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByText("Technical details")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Documents" }),
    ).not.toBeInTheDocument();
  });

  it("blocks navigation when DocsStep has no file uploaded", async () => {
    const { user } = renderWizard();

    await fillGeneralStep(user);
    await fillTechnicalStep(user);

    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(
      screen.getByRole("heading", { name: "Documents" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Attributes" }),
    ).not.toBeInTheDocument();
  });
});

describe("CreateEServiceForm — file upload", () => {
  it("shows uploaded file name and allows removal", async () => {
    const { user } = renderWizard();

    await fillGeneralStep(user);
    await fillTechnicalStep(user);

    // On DocsStep — upload a file
    const file = new File(['{"openapi":"3.0.0"}'], "spec.json", {
      type: "application/json",
    });
    const fileInput = document.querySelector("input[type='file']");
    expect(fileInput).toBeTruthy();
    await user.upload(fileInput as HTMLInputElement, file);

    // File name should be visible
    expect(screen.getByText("spec.json")).toBeInTheDocument();

    // Remove the file
    await user.click(
      screen.getByRole("button", { name: /delete spec\.json/i }),
    );

    // File name should be gone
    expect(screen.queryByText("spec.json")).not.toBeInTheDocument();
  });

  it("rejects files that are not YAML or JSON", async () => {
    const { user } = renderWizard();

    await fillGeneralStep(user);
    await fillTechnicalStep(user);

    const xmlFile = new File(["<root/>"], "spec.xml", {
      type: "application/xml",
    });
    const fileInput = document.querySelector("input[type='file']");
    expect(fileInput).toBeTruthy();

    // The file input accept attribute restricts to .yaml/.yml/.json,
    // so uploading .xml is silently ignored by the browser
    await user.upload(fileInput as HTMLInputElement, xmlFile);

    // File should NOT appear — the accept filter blocked it
    expect(screen.queryByText("spec.xml")).not.toBeInTheDocument();

    // Trying to advance still fails because no valid file was set
    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(
      screen.getByRole("heading", { name: "Documents" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Attributes" }),
    ).not.toBeInTheDocument();
  });

  it("accepts YAML files", async () => {
    const { user } = renderWizard();

    await fillGeneralStep(user);
    await fillTechnicalStep(user);

    const yamlFile = new File(["openapi: 3.0.0"], "spec.yaml", {
      type: "application/yaml",
    });
    const fileInput = document.querySelector("input[type='file']");
    expect(fileInput).toBeTruthy();
    await user.upload(fileInput as HTMLInputElement, yamlFile);

    expect(screen.getByText("spec.yaml")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Next" }));
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Attributes" }),
      ).toBeInTheDocument();
    });
  });
});

describe("CreateEServiceForm — publish flow", () => {
  it("completes the full wizard flow and navigates to the detail page", async () => {
    server.use(
      http.post(`${BASE_URL}/producer/eservices`, () =>
        HttpResponse.json({ id: "new-eservice-123" }, { status: 201 }),
      ),
    );

    const { router, user } = renderWizard();

    await fillGeneralStep(user);
    await fillTechnicalStep(user);
    await fillDocsStep(user);
    await fillAttributesStep(user);

    expect(screen.getByText("My Test E-Service")).toBeInTheDocument();
    expect(
      screen.getByText("A complete test description for the e-service"),
    ).toBeInTheDocument();
    expect(screen.getByText("Provide data")).toBeInTheDocument();
    expect(screen.getByText("spec.json")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Publish" }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe(
        "/production/e-services/new-eservice-123",
      );
    });
  });

  it("shows error banner when BFF mutation fails", async () => {
    server.use(
      http.post(`${BASE_URL}/producer/eservices`, () =>
        HttpResponse.json(
          {
            correlationId: "test",
            status: 500,
            title: "Internal Server Error",
          },
          { status: 500 },
        ),
      ),
    );

    const { user } = renderWizard();

    await fillGeneralStep(user);
    await fillTechnicalStep(user);
    await fillDocsStep(user);
    await fillAttributesStep(user);

    await user.click(screen.getByRole("button", { name: "Publish" }));

    await waitFor(() => {
      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });
    expect(
      screen.getByText(/Don't refresh the page to avoid data loss/),
    ).toBeInTheDocument();
  });
});

describe("CreateEServiceForm — multi-select trigger text", () => {
  it("joins selected attributes within a group with 'or'", async () => {
    const { user } = renderWizard();

    await fillGeneralStep(user);
    await fillTechnicalStep(user);
    await fillDocsStep(user);

    const attrSelect = screen.getByRole("button", { name: /attributes/i });

    await user.click(attrSelect);
    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });

    const options = screen.getAllByRole("option");
    expect(options.length).toBeGreaterThanOrEqual(2);
    await user.click(options[0] as HTMLElement);
    await user.click(options[1] as HTMLElement);

    await user.keyboard("{Escape}");
    await waitFor(() => {
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    expect(attrSelect).toHaveAccessibleName(/\bor\b/i);
    expect(attrSelect).not.toHaveAccessibleName(/\band\b/i);
  });

  it("joins selected categories on GeneralStep with 'and' (regression guard)", async () => {
    const { user } = renderWizard();

    const categoriesSelect = screen.getByRole("button", {
      name: /categories \(optional\)/i,
    });

    await user.click(categoriesSelect);
    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });

    const options = screen.getAllByRole("option");
    expect(options.length).toBeGreaterThanOrEqual(2);
    await user.click(options[0] as HTMLElement);
    await user.click(options[1] as HTMLElement);

    await user.keyboard("{Escape}");
    await waitFor(() => {
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    expect(categoriesSelect).toHaveAccessibleName(/\band\b/i);
    expect(categoriesSelect).not.toHaveAccessibleName(/\bor\b/i);
  });
});
