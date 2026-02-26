import type { Attribute } from "@knodia/attribute-models";

import type { AgreementAttributeSQL } from "../agreement.ts";

export const toAgreementAttribute = (
  attributeSQL: AgreementAttributeSQL,
): Attribute => ({
  code: attributeSQL.code,
  scheme: attributeSQL.scheme,
});
