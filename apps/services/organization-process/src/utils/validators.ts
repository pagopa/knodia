import type { KnodeId, OrganizationId } from "@knodia/common-models/ids";
import type { ExternalUISessionAuthData } from "@knodia/fastify-zod-api-commons/auth";

import { organizationTokenClaimMismatch } from "../models/errors.ts";

// Agreement producers are always local to this knode, while consumers
// are remote. So the producer values from the token are checked here.
export function assertTokenOrganizationClaimsMatchPathParam(
  authData: ExternalUISessionAuthData,
  pathOrganizationId: OrganizationId,
  thisKnodeId: KnodeId,
): void {
  if (pathOrganizationId !== authData.producer.id) {
    throw organizationTokenClaimMismatch(
      "producer.id",
      authData.producer.id,
      pathOrganizationId,
    );
  }
  if (thisKnodeId !== authData.producer.knodeId) {
    throw organizationTokenClaimMismatch(
      "producer.knodeId",
      authData.producer.knodeId,
      thisKnodeId,
    );
  }
}
