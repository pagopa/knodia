import type { EserviceTemplateId, KnodeId } from "@knodia/common-models/ids";

import {
  type EserviceTemplate,
  getEserviceTemplate,
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
