import type { EserviceTemplateId, KnodeId } from "@knodia/common-models/ids";

import { genericInternalError } from "@knodia/common-models/errors";
import {
  type EserviceTemplate,
  getEserviceTemplate,
  getEserviceTemplateInterfaceContent,
} from "@knodia/eservice-template-models";
import yaml from "js-yaml";
import { match, P } from "ts-pattern";
import { z } from "zod";

import type { API_InterfaceDocumentOverrides } from "../models/eservice/api.ts";

import { eserviceTemplateNotFound } from "../models/errors.ts";

/**
 * Applies the supported overrides to a template interface document.
 *
 * The current E-service templates are mock data and their interface, so this
 * function does not perform full OpenAPI schema validation.
 * It only parses the known document formats and updates the fields that can
 * be customized when instantiating a template.
 */
export function applyInterfaceDocumentOverrides({
  content,
  fileName,
  overrides,
}: {
  content: Buffer;
  fileName: string;
  overrides: API_InterfaceDocumentOverrides;
}) {
  try {
    const { interfaceObj: parsedInterfaceObj, serialize } = match(
      fileName.toLowerCase(),
    )
      .with(P.string.endsWith(".json"), () => ({
        interfaceObj: JSON.parse(content.toString("utf-8")),
        serialize: (obj: unknown) => JSON.stringify(obj, null, 2),
      }))
      .with(P.string.endsWith(".yaml"), P.string.endsWith(".yml"), () => ({
        interfaceObj: yaml.load(content.toString("utf-8")),
        serialize: (obj: unknown) => yaml.dump(obj),
      }))
      .otherwise(() => {
        throw genericInternalError(
          `Unsupported interface file type: ${fileName}`,
        );
      });

    const interfaceObj = z
      .looseObject({
        info: z.looseObject({}).optional(),
        servers: z.array(z.unknown()).optional(),
      })
      .parse(parsedInterfaceObj);

    const info = interfaceObj.info ?? {};

    info["contact"] = overrides.contact;

    if (overrides.termsOfService === undefined) {
      delete info["termsOfService"];
    } else {
      info["termsOfService"] = overrides.termsOfService;
    }

    return Buffer.from(
      serialize({
        ...interfaceObj,
        info,
        servers: overrides.serverUrls.map((url) => ({ url })),
      }),
      "utf8",
    );
  } catch (error) {
    throw genericInternalError(
      `Failed to apply interface document overrides: ${(error as Error).message}`,
    );
  }
}

export function retrieveEserviceTemplate(
  eserviceTemplateId: EserviceTemplateId,
  knodeId: KnodeId,
): EserviceTemplate {
  const template = getEserviceTemplate(eserviceTemplateId, knodeId);

  if (template === undefined) {
    throw eserviceTemplateNotFound(eserviceTemplateId, knodeId);
  }

  return template;
}

export function retrieveEserviceTemplateInterfaceContent(
  eserviceTemplate: EserviceTemplate,
): Buffer<ArrayBufferLike> {
  const interfaceDocument = eserviceTemplate.eserviceFields.interfaceDocument;

  const templateInterfaceContent = getEserviceTemplateInterfaceContent(
    interfaceDocument.name,
  );

  if (templateInterfaceContent === undefined) {
    /**
     * This case should not happen as the interface documents for the templates are
     * required. If it happens, it means there is a problem with the data mock
     * and a 500 Internal Server Error is more appropriate than a 404 Not Found.
     */
    throw genericInternalError(
      `Interface document ${interfaceDocument.name} not found for E-service template ${eserviceTemplate.id}`,
    );
  }

  return templateInterfaceContent;
}
