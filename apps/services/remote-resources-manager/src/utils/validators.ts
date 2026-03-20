import type { AttributeId } from "@knodia/attribute-models";
import type { ExternalId } from "@knodia/common-models/externalResource";
import type { EserviceId, OrganizationId } from "@knodia/common-models/ids";
import type { k2kGatewayApi } from "@knodia/k2k-gateway-client";

import { consumerMissingRequiredAttributes } from "../models/errors.ts";

export function assertConsumerHasRequiredAttributes(
  consumerAttributes: readonly AttributeId[],
  requiredAttributes: k2kGatewayApi.RequiredAttributes,
  consumerId: OrganizationId,
  eserviceId: ExternalId<EserviceId>,
): void {
  const hasAll = requiredAttributes.every((group) =>
    group.some((requiredAtt) =>
      consumerAttributes.some(
        (consumerAtt) =>
          consumerAtt.code === requiredAtt.code &&
          consumerAtt.scheme === requiredAtt.scheme,
      ),
    ),
  );
  if (!hasAll) {
    throw consumerMissingRequiredAttributes(consumerId, eserviceId);
  }
}
