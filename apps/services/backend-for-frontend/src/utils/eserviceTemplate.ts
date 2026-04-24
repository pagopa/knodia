import type { EserviceTemplateId, KnodeId } from "@knodia/common-models/ids";

import { genericInternalError } from "@knodia/common-models/errors";
import {
  type EserviceTemplate,
  getEserviceTemplate,
  getEserviceTemplateInterfaceContent,
} from "@knodia/eservice-template-models";

import { eserviceTemplateNotFound } from "../models/errors.ts";

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
