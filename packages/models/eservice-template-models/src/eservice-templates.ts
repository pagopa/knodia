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

const EserviceTemplateInterface = z.object({
  contentType: z.string(),
  name: z.string(),
  prettyName: LocalizedName,
});
type EserviceTemplateInterface = z.infer<typeof EserviceTemplateInterface>;

/* eslint-disable perfectionist/sort-objects */
/** @knipignore */
export const EserviceTemplate = z.object({
  id: EserviceTemplateId,

  // Info used for display and selection of the template
  name: LocalizedName,
  description: LocalizedDescription,

  // Fields locked (set by the template, not modifiable by the user when instantiating an e-service from the template)
  mode: EserviceMode,
  categories: z.array(EserviceCategory),
  requiredAttributes: z.array(AttributeGroup),
  interfaceDocument: EserviceTemplateInterface,

  createdAt: z.coerce.date(), // Used for sorting (for now)
});
/* eslint-enable perfectionist/sort-objects */

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

const sharedInterfaceDocument = {
  contentType: "application/yaml",
  name: "openapi.yaml",
  prettyName: { en: "API Interface" },
};

/** @knipignore */
export const eserviceTemplates: Record<KnodeId, EserviceTemplate[]> = {
  Lynx: [
    {
      categories: [
        mockedCategory(
          "vc_example_eservice_categories",
          "citizen.identity.birth_date",
        ),
        mockedCategory(
          "vc_example_eservice_categories",
          "citizen.identity.marital_status",
        ),
      ],
      createdAt: new Date("2025-01-01T00:00:00Z"),
      description: {
        en: "Provides verified citizen identity information including birth data and marital status.",
      },
      id: unsafeBrandId("6067609a-1eec-4e3e-8300-764000dd0440"),
      interfaceDocument: sharedInterfaceDocument,
      mode: EserviceMode.enum.ProvideData,
      name: { en: "Citizen Identity Data Provider" },
      requiredAttributes: [[mockedAttribute("vc_territorial_units", "nuts2")]],
    },
    {
      categories: [
        mockedCategory(
          "vc_example_eservice_categories",
          "citizen.residence.residence_place",
        ),
        mockedCategory(
          "vc_example_eservice_categories",
          "citizen.residence.digital_domicile",
        ),
      ],
      createdAt: new Date("2025-01-02T00:00:00Z"),
      description: {
        en: "Provides citizen residence information including digital domicile and residence place.",
      },
      id: unsafeBrandId("f0cec351-d498-4666-8d46-b2a6dfb821aa"),
      interfaceDocument: sharedInterfaceDocument,
      mode: EserviceMode.enum.ProvideData,
      name: { en: "Citizen Residence Data Provider" },
      requiredAttributes: [
        [
          mockedAttribute("vc_territorial_units", "nuts2"),
          mockedAttribute("vc_territorial_units", "nuts1"),
        ],
      ],
    },
  ],
  Orion: [
    {
      categories: [
        mockedCategory(
          "vc_example_eservice_categories",
          "organization.public_administration.address",
        ),
        mockedCategory(
          "vc_example_eservice_categories",
          "organization.public_administration.typology",
        ),
      ],
      createdAt: new Date("2025-01-01T00:00:00Z"),
      description: {
        en: "Receives and processes data related to public administration typology and address.",
      },
      id: unsafeBrandId("4834a8bf-84a0-4bf2-8f1e-4102d11b58a9"),
      interfaceDocument: sharedInterfaceDocument,
      mode: EserviceMode.enum.ProvideData,
      name: { en: "Public Administration Data Receiver" },
      requiredAttributes: [[mockedAttribute("vc_territorial_units", "nuts3")]],
    },
    {
      categories: [
        mockedCategory(
          "vc_example_eservice_categories",
          "organization.private_company.economic_activity",
        ),
        mockedCategory(
          "vc_example_eservice_categories",
          "organization.private_company.digital_domicile",
        ),
      ],
      createdAt: new Date("2025-01-02T00:00:00Z"),
      description: {
        en: "Provides data on private company economic activities and digital domicile.",
      },
      id: unsafeBrandId("bec95864-6ca6-4256-bd10-b33ce7868ecd"),
      interfaceDocument: sharedInterfaceDocument,
      mode: EserviceMode.enum.ProvideData,
      name: { en: "Private Company Economic Activity Provider" },
      requiredAttributes: [
        [mockedAttribute("vc_territorial_units", "nuts1")],
        [
          mockedAttribute("vc_territorial_units", "nuts2"),
          mockedAttribute("vc_territorial_units", "nuts3"),
        ],
      ],
    },
  ],
};

/** @knipignore */
export function getEserviceTemplate(
  eserviceTemplateId: EserviceTemplateId,
  knodeId: KnodeId,
): EserviceTemplate | undefined {
  return eserviceTemplates[knodeId].find(
    (template) => template.id === eserviceTemplateId,
  );
}

/** @knipignore */
export function getEserviceTemplateInterfaceContent(
  interfaceName: string,
): Buffer<ArrayBufferLike> | undefined {
  try {
    return readFileSync(
      new URL(`../fixtures/${interfaceName}`, import.meta.url),
    );
  } catch {
    return undefined;
  }
}
