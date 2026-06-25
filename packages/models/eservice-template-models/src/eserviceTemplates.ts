import {
  type AttributeCode,
  AttributeGroup,
  type AttributeId,
  type AttributeScheme,
} from "@knodia/attribute-models";
import {
  type CategoryCode,
  type CategoryScheme,
} from "@knodia/category-models";
import {
  EserviceTemplateId,
  type KnodeId,
  unsafeBrandId,
} from "@knodia/common-models/ids";
import { LocalizedText } from "@knodia/common-models/localization";
import { EserviceCategory, EserviceMode } from "@knodia/eservice-models";
import { readFileSync } from "node:fs";
import z from "zod";

const maxNameLength = 60;
const minNameLength = 5;

const maxDescriptionLength = 250;
const minDescriptionLength = 10;

const LocalizedName = LocalizedText(minNameLength, maxNameLength);
type LocalizedName = z.infer<typeof LocalizedName>;

const LocalizedDescription = LocalizedText(
  minDescriptionLength,
  maxDescriptionLength,
);
type LocalizedDescription = z.infer<typeof LocalizedDescription>;

const EserviceTemplateInterface = z.strictObject({
  contentType: z.string(),
  name: z.string(),
  prettyName: LocalizedName,
});
type EserviceTemplateInterface = z.infer<typeof EserviceTemplateInterface>;

const EserviceTemplateEserviceFields = z.strictObject({
  categories: z.array(EserviceCategory),
  interfaceDocument: EserviceTemplateInterface,
  mode: EserviceMode,
  requiredAttributes: z.array(AttributeGroup),
});

export const EserviceTemplate = z.strictObject({
  createdAt: z.coerce.date(), // Used for sorting (for now)
  description: LocalizedDescription,
  eserviceFields: EserviceTemplateEserviceFields,
  id: EserviceTemplateId,
  name: LocalizedName,
});

export type EserviceTemplate = z.infer<typeof EserviceTemplate>;

/**
 * Helper function to create mocked categories and attributes with correct typing,
 * to avoid mistakes in the template mock data definitions.
 */
const mockedAttribute = <
  S extends AttributeScheme,
  C extends AttributeCode<S> & string,
>(
  scheme: S,
  code: C,
): AttributeId => ({ code, scheme });

const mockedCategory = <
  S extends CategoryScheme,
  C extends CategoryCode<S> & string,
>(
  scheme: S,
  code: C,
): EserviceCategory => ({ code, scheme });

const interfaceDocument = (
  name: string,
  prettyName: string,
): EserviceTemplateInterface => ({
  contentType: "application/yaml",
  name,
  prettyName: { en: prettyName },
});

const testingOrganizationRequiredAttributes = [
  [mockedAttribute("knodia", "testing_organization")],
];

/** @knipignore */
const eserviceTemplates: Record<KnodeId, EserviceTemplate[]> = {
  Lynx: [
    {
      createdAt: new Date("2025-01-01T00:00:00Z"),
      description: {
        en: "API for recovering the birth place of a natural person",
      },
      eserviceFields: {
        categories: [
          mockedCategory(
            "vc_example_eservice_categories",
            "citizen.identity.birth_place",
          ),
        ],
        interfaceDocument: interfaceDocument(
          "recovery-birth-place.yaml",
          "Recovery of the birth place",
        ),
        mode: EserviceMode.enum.ProvideData,
        requiredAttributes: testingOrganizationRequiredAttributes,
      },
      id: unsafeBrandId("9c708970-7db8-4581-9dbe-88fc70567149"),
      name: { en: "Recovery of the birth place of a natural person" },
    },
    {
      createdAt: new Date("2025-01-02T00:00:00Z"),
      description: {
        en: "API for recovering the birth date of a natural person",
      },
      eserviceFields: {
        categories: [
          mockedCategory(
            "vc_example_eservice_categories",
            "citizen.identity.birth_date",
          ),
        ],
        interfaceDocument: interfaceDocument(
          "recovery-birth-date.yaml",
          "Recovery of the birth date",
        ),
        mode: EserviceMode.enum.ProvideData,
        requiredAttributes: testingOrganizationRequiredAttributes,
      },
      id: unsafeBrandId("4c34186c-3713-4dd1-a511-14a6f75c8881"),
      name: { en: "Recovery of the birth date of a natural person" },
    },
  ],
  Orion: [
    {
      createdAt: new Date("2025-01-01T00:00:00Z"),
      description: {
        en: "API for recovering the residence of a natural person",
      },
      eserviceFields: {
        categories: [
          mockedCategory(
            "vc_example_eservice_categories",
            "citizen.residence.residence_place",
          ),
        ],
        interfaceDocument: interfaceDocument(
          "recovery-residence.yaml",
          "Recovery of the residence",
        ),
        mode: EserviceMode.enum.ProvideData,
        requiredAttributes: testingOrganizationRequiredAttributes,
      },
      id: unsafeBrandId("2fb8e60c-8da3-4ab5-bfb0-86d6fcafe381"),
      name: { en: "Recovery of the residence of a natural person" },
    },
    {
      createdAt: new Date("2025-01-02T00:00:00Z"),
      description: {
        en: "API for recovering the contact point of a private company",
      },
      eserviceFields: {
        categories: [
          mockedCategory(
            "vc_example_eservice_categories",
            "organization.private_company.digital_domicile",
          ),
        ],
        interfaceDocument: interfaceDocument(
          "recovery-company-contact-point.yaml",
          "Recovery of the company contact point",
        ),
        mode: EserviceMode.enum.ProvideData,
        requiredAttributes: testingOrganizationRequiredAttributes,
      },
      id: unsafeBrandId("6897703b-c9ca-4864-a304-248cc8a8a2d1"),
      name: { en: "Recovery of the contact point of a private company" },
    },
  ],
};

export function getEserviceTemplate(
  eserviceTemplateId: EserviceTemplateId,
  knodeId: KnodeId,
): EserviceTemplate | undefined {
  return eserviceTemplates[knodeId].find(
    (template) => template.id === eserviceTemplateId,
  );
}

export function getEserviceTemplateInterfaceContent(
  interfaceName: string,
): Buffer<ArrayBufferLike> | undefined {
  try {
    return readFileSync(
      new URL(`./fixtures/${interfaceName}`, import.meta.url),
    );
  } catch {
    return undefined;
  }
}

export function getEserviceTemplates(knodeId: KnodeId): EserviceTemplate[] {
  return eserviceTemplates[knodeId];
}
