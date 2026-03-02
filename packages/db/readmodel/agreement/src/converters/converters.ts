import type { AttributeId } from "@knodia/attribute-models";

import type { AgreementAttributeSQL } from "../agreement.ts";

export const toAgreementAttribute = (
  attributeSQL: AgreementAttributeSQL,
): AttributeId => ({
  code: attributeSQL.code,
  scheme: attributeSQL.scheme,
});
