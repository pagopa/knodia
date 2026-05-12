import type { KnodeId, PurposeTemplateId } from "@knodia/common-models/ids";

import {
  getPurposeTemplate,
  type PurposeTemplate,
} from "@knodia/purpose-template-models";

import { purposeTemplateNotFound } from "../models/errors.ts";

export function retrievePurposeTemplate(
  purposeTemplateId: PurposeTemplateId,
  knodeId: KnodeId,
): PurposeTemplate {
  const template = getPurposeTemplate(purposeTemplateId, knodeId);

  if (template === undefined) {
    throw purposeTemplateNotFound(purposeTemplateId, knodeId);
  }

  return template;
}
