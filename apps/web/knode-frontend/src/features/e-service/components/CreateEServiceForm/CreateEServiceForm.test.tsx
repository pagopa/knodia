import type { bffApi } from "@knodia/bff-client";

import { within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";

import { server } from "@/test/msw/server";
import { renderWithProviders, screen, waitFor } from "@/test/utils";

import { CreateEServiceForm } from "./CreateEServiceForm";

const BASE_URL = "http://localhost:3000/bff";

const TEST_TEMPLATE: bffApi.EserviceTemplateDetails = {
  createdAt: "2025-01-02T00:00:00.000Z",
  description: {
    en: "Provides citizen residence information including digital domicile and residence place.",
  },
  eserviceFields: {
    categories: [
      {
        code: "citizen.residence.residence_place",
        scheme: "vc_example_eservice_categories",
      },
      {
        code: "citizen.residence.digital_domicile",
        scheme: "vc_example_eservice_categories",
      },
    ],
    interfaceDocument: {
      contentType: "application/yaml",
      name: "openapi.yaml",
      prettyName: { en: "API Interface" },
    },
    mode: "ProvideData",
    requiredAttributes: [
      [
        { code: "nuts2", scheme: "vc_territorial_units" },
        { code: "nuts1", scheme: "vc_territorial_units" },
      ],
    ],
  },
  id: "f0cec351-d498-4666-8d46-b2a6dfb821aa",
  knodeId: "Lynx",
  name: { en: "Citizen Residence Data Provider" },
};

// Disambiguates the attributes field's dropdown trigger from the "Attributes
// list" doc button — both expose an accessible name containing "Attributes".
const attributesSelectName = (name: string) =>
  name.includes("Attributes") && name !== "Attributes list";

/** Helper: select first attribute on AttributesStep and click Next */
async function fillAttributesStep(
  user: ReturnType<typeof renderWizard>["user"],
) {
  const attrSelect = screen.getByRole("button", { name: attributesSelectName });

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
  { enableSignalHub = false }: { enableSignalHub?: boolean } = {},
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

  if (enableSignalHub) {
    const signalHubCheckbox = screen.getByRole("checkbox", {
      name: "I will notify data changes on Signal Hub",
    });
    expect(signalHubCheckbox).toBeEnabled();
    await user.click(signalHubCheckbox);
  }

  await user.click(screen.getByRole("button", { name: "Next" }));
  expect(
    await screen.findByRole("heading", { name: "Documents" }),
  ).toBeInTheDocument();
}

async function fillTemplateAttributesStep(
  user: ReturnType<typeof renderWizard>["user"],
) {
  // Template attributes are locked: shown as read-only chips with no remove control.
  expect(screen.getByText("NUTS 2")).toBeInTheDocument();
  expect(screen.getByText("NUTS 1")).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /^Remove/i }),
  ).not.toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Next" }));
  await waitFor(() => {
    expect(screen.getByRole("heading", { name: "Recap" })).toBeInTheDocument();
  });
}

async function fillTemplateDocsStep(
  user: ReturnType<typeof renderWizard>["user"],
) {
  expect(screen.getByText("API Interface")).toBeInTheDocument();
  expect(document.querySelector("input[type='file']")).not.toBeInTheDocument();

  await user.type(
    screen.getByLabelText("Server URL"),
    "https://server.rigel.com",
  );
  await user.type(
    screen.getByLabelText("Terms and Conditions URL (optional)"),
    "https://rigel.com/terms",
  );
  await user.type(screen.getByLabelText("Contact name"), "John Smith");
  await user.type(
    screen.getByLabelText("Contact email"),
    "johnsmith@rigel.com",
  );
  await user.type(
    screen.getByLabelText("Contact URL (optional)"),
    "https://rigel.com/contact",
  );

  await user.click(screen.getByRole("button", { name: "Next" }));
  await waitFor(() => {
    expect(
      screen.getByRole("heading", { name: "Attributes" }),
    ).toBeInTheDocument();
  });
}

function renderWizard({
  onLeave = vi.fn(),
  template,
}: {
  onLeave?: () => void;
  template?: bffApi.EserviceTemplateDetails;
} = {}) {
  return {
    onLeave,
    ...renderWithProviders(
      <CreateEServiceForm onLeave={onLeave} template={template} />,
      {
        routes: [{ path: "/production/e-services/$id" }],
      },
    ),
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

describe("CreateEServiceForm — template flow", () => {
  it("renders template documents fields instead of the scratch file upload", async () => {
    const { user } = renderWizard({ template: TEST_TEMPLATE });

    await fillGeneralStep(user);
    await fillTechnicalStep(user);

    expect(screen.getByText("API Interface")).toBeInTheDocument();
    expect(screen.getByLabelText("Server URL")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Terms and Conditions URL (optional)"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Contact name")).toBeInTheDocument();
    expect(screen.getByLabelText("Contact email")).toBeInTheDocument();
    expect(screen.getByLabelText("Contact URL (optional)")).toBeInTheDocument();
    expect(
      document.querySelector("input[type='file']"),
    ).not.toBeInTheDocument();
  });

  it("uses template attributes as read-only values and reaches the recap without selecting attributes", async () => {
    const { user } = renderWizard({ template: TEST_TEMPLATE });

    await fillGeneralStep(user);
    await fillTechnicalStep(user);
    await fillTemplateDocsStep(user);
    await fillTemplateAttributesStep(user);

    expect(screen.getByText("NUTS 2")).toBeInTheDocument();
    expect(screen.getByText("NUTS 1")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: attributesSelectName }),
    ).not.toBeInTheDocument();
  });

  it("shows template documents and contact data in the recap", async () => {
    const { user } = renderWizard({ template: TEST_TEMPLATE });

    await fillGeneralStep(user);
    await fillTechnicalStep(user);
    await fillTemplateDocsStep(user);
    await fillTemplateAttributesStep(user);

    expect(screen.getByText("API Interface")).toBeInTheDocument();
    expect(screen.getByText("https://server.rigel.com")).toBeInTheDocument();
    expect(screen.getByText("https://rigel.com/terms")).toBeInTheDocument();
    expect(screen.getByText("John Smith")).toBeInTheDocument();
    expect(screen.getByText("johnsmith@rigel.com")).toBeInTheDocument();
    expect(screen.getByText("https://rigel.com/contact")).toBeInTheDocument();
    expect(screen.queryByText("File checksum")).not.toBeInTheDocument();
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

  it("publishes a from-scratch E-Service with Signal Hub enabled", async () => {
    let capturedBody: unknown;

    server.use(
      http.post(`${BASE_URL}/producer/eservices`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ id: "new-eservice-123" }, { status: 201 });
      }),
    );

    const { user } = renderWizard();

    await fillGeneralStep(user);
    await fillTechnicalStep(user, { enableSignalHub: true });
    await fillDocsStep(user);
    await fillAttributesStep(user);

    await user.click(screen.getByRole("button", { name: "Publish" }));

    await waitFor(() => {
      expect(capturedBody).toMatchObject({ isSignalHubEnabled: true });
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

  it("publishes an E-Service from template with interface overrides", async () => {
    let capturedBody: unknown;

    server.use(
      http.post(
        `${BASE_URL}/producer/eservices/fromTemplate`,
        async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json({ id: "new-eservice-123" }, { status: 201 });
        },
      ),
    );

    const { router, user } = renderWizard({ template: TEST_TEMPLATE });

    await fillGeneralStep(user);
    await fillTechnicalStep(user);
    await fillTemplateDocsStep(user);
    await fillTemplateAttributesStep(user);

    await user.click(screen.getByRole("button", { name: "Publish" }));

    await waitFor(() => {
      expect(capturedBody).toEqual({
        accessTokenAudience: ["https://api.test.com"],
        accessTokenDuration: 60 * 60,
        accessTokenType: "Bearer",
        description: { en: "A complete test description for the e-service" },
        interfaceDocumentOverrides: {
          contact: {
            email: "johnsmith@rigel.com",
            name: "John Smith",
            url: "https://rigel.com/contact",
          },
          serverUrls: ["https://server.rigel.com"],
          termsOfService: "https://rigel.com/terms",
        },
        isSignalHubEnabled: false,
        maxDailyCallsPerConsumer: 100,
        maxDailyCallsPerKnode: 1000,
        name: { en: "My Test E-Service" },
        template: {
          id: "f0cec351-d498-4666-8d46-b2a6dfb821aa",
          knodeId: "Lynx",
        },
      });
      expect(router.state.location.pathname).toBe(
        "/production/e-services/new-eservice-123",
      );
    });
  });

  it("shows error banner when template BFF mutation fails", async () => {
    server.use(
      http.post(`${BASE_URL}/producer/eservices/fromTemplate`, () =>
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

    const { user } = renderWizard({ template: TEST_TEMPLATE });

    await fillGeneralStep(user);
    await fillTechnicalStep(user);
    await fillTemplateDocsStep(user);
    await fillTemplateAttributesStep(user);

    await user.click(screen.getByRole("button", { name: "Publish" }));

    await waitFor(() => {
      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });
  });
});

describe("CreateEServiceForm — attribute multi-select (KN-814)", () => {
  const chips = () =>
    screen.getByRole("grid", { name: /attributes \(selected\)/i });

  it("lists the standard set and other-knode organizations, and selecting them adds chips", async () => {
    const { user } = renderWizard();

    await fillGeneralStep(user);
    await fillTechnicalStep(user);
    await fillDocsStep(user);

    await user.click(screen.getByRole("combobox", { name: /attributes/i }));
    await user.keyboard("{ArrowDown}");
    const listbox = await screen.findByRole("listbox");

    // An other-knode org (label = org name) and a standard attribute both appear.
    await waitFor(() => {
      expect(
        within(listbox).getByRole("option", { name: "Vega 001 Org" }),
      ).toBeInTheDocument();
    });
    expect(
      within(listbox).getByRole("option", { name: "Testing Organization" }),
    ).toBeInTheDocument();

    await user.click(
      within(listbox).getByRole("option", { name: "Vega 001 Org" }),
    );
    await user.click(
      within(listbox).getByRole("option", { name: "Testing Organization" }),
    );

    await user.keyboard("{Escape}");
    await waitFor(() => {
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    // Both selections render as chips, the org chip labelled by the org name.
    expect(within(chips()).getByText("Vega 001 Org")).toBeInTheDocument();
    expect(
      within(chips()).getByText("Testing Organization"),
    ).toBeInTheDocument();
  });

  // Chips persisting while the dropdown filter excludes them is not asserted
  // here: jsdom models the react-aria combobox reopen+type interaction
  // unfaithfully (chips query differently while the menu is open). The behaviour
  // holds because chip labels derive from the form value via `getSchemeRefLabel`,
  // not from the current (filtered) collection.

  it("degrades to the standard set when the remote knode fails", async () => {
    server.use(
      http.get(`${BASE_URL}/organizations`, () =>
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

    // Standard attributes remain selectable; no remote orgs are offered.
    await user.click(screen.getByRole("combobox", { name: /attributes/i }));
    await user.keyboard("{ArrowDown}");
    const listbox = await screen.findByRole("listbox");
    expect(
      within(listbox).getByRole("option", { name: "Testing Organization" }),
    ).toBeInTheDocument();
    expect(
      within(listbox).queryByRole("option", { name: "Vega 001 Org" }),
    ).not.toBeInTheDocument();
  });
});

describe("CreateEServiceForm — categories multi-select (regression guard)", () => {
  it("joins selected categories on GeneralStep with 'and'", async () => {
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
