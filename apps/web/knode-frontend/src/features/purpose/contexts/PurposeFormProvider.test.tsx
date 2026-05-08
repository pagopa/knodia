import type { bffApi } from "@knodia/bff-client";

import {
  type EserviceId,
  KnodeId,
  unsafeBrandId,
} from "@knodia/common-models/ids";
import { describe, expect, it } from "vitest";

import type { ConsumptionEserviceDetail } from "@/features/e-service/models/consumption-eservice-detail";

import { renderWithProviders, screen } from "@/test/utils";

import { PurposeFormProvider } from "./PurposeFormProvider";
import { usePurposeWizardContext } from "./usePurposeFormContext";

const KNODE_ID = KnodeId.enum.Orion;
const ESERVICE_ID = unsafeBrandId<EserviceId>(
  "10000000-0000-4000-8000-000000000001",
);

const mockEservice = {
  id: ESERVICE_ID,
  maxDailyCalls: { perConsumer: 100, perKnode: 1000 },
  name: "Test E-Service",
} as ConsumptionEserviceDetail;

const mockTemplate: bffApi.PurposeTemplateDetails = {
  createdAt: "2026-01-01T00:00:00Z",
  description: { en: "A template description" },
  formAnswersJson: { foo: "bar", legalBasis: ["CONSENT"] },
  formSchemaVersion: "1.0",
  id: "11111111-1111-4111-8111-000000000001",
  name: { en: "A template name" },
};

function ContextProbe() {
  const { data, formAnswers, selectedTemplate } = usePurposeWizardContext();
  return (
    <>
      <div data-testid="name">{data.name}</div>
      <div data-testid="description">{data.description}</div>
      <div data-testid="dailyCalls">{String(data.dailyCalls)}</div>
      <div data-testid="formAnswers">{JSON.stringify(formAnswers)}</div>
      <div data-testid="selectedTemplate">
        {JSON.stringify(selectedTemplate ?? null)}
      </div>
    </>
  );
}

describe("PurposeFormProvider", () => {
  it("starts empty when initialTemplate is not provided", () => {
    renderWithProviders(
      <PurposeFormProvider
        eservice={mockEservice}
        formSchemaVersion="1.0"
        knodeId={KNODE_ID}
      >
        <ContextProbe />
      </PurposeFormProvider>,
    );

    expect(screen.getByTestId("name").textContent).toBe("");
    expect(screen.getByTestId("description").textContent).toBe("");
    expect(screen.getByTestId("formAnswers").textContent).toBe("{}");
    expect(screen.getByTestId("selectedTemplate").textContent).toBe("null");
  });

  it("prepopulates name, description, formAnswers, and selectedTemplate from initialTemplate", () => {
    renderWithProviders(
      <PurposeFormProvider
        eservice={mockEservice}
        formSchemaVersion="1.0"
        initialTemplate={mockTemplate}
        knodeId={KNODE_ID}
      >
        <ContextProbe />
      </PurposeFormProvider>,
    );

    expect(screen.getByTestId("name").textContent).toBe("A template name");
    expect(screen.getByTestId("description").textContent).toBe(
      "A template description",
    );
    expect(
      JSON.parse(screen.getByTestId("formAnswers").textContent ?? ""),
    ).toEqual({
      foo: "bar",
      legalBasis: ["CONSENT"],
    });
    expect(
      JSON.parse(screen.getByTestId("selectedTemplate").textContent ?? ""),
    ).toEqual({ id: mockTemplate.id, knodeId: KNODE_ID });
  });

  it("does not pre-fill dailyCalls from the template (template has none)", () => {
    renderWithProviders(
      <PurposeFormProvider
        eservice={mockEservice}
        formSchemaVersion="1.0"
        initialTemplate={mockTemplate}
        knodeId={KNODE_ID}
      >
        <ContextProbe />
      </PurposeFormProvider>,
    );

    expect(screen.getByTestId("dailyCalls").textContent).toBe("NaN");
  });
});
