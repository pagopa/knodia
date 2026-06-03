import type { KnodeId, SignupUserId } from "@knodia/common-models/ids";

import { v5 as uuidv5 } from "uuid";

// Stable per-(signup user, Knode) idempotency key for createOrganization, so a
// redelivery of the same signup event resolves to the same organization instead
// of creating a duplicate. The signup user's id (a UUID) serves as the v5
// namespace and the Knode as the name, giving each Knode its own deterministic key.
export function organizationExternalRequestId(
  signupUserId: SignupUserId,
  knodeId: KnodeId,
): string {
  return uuidv5(knodeId, signupUserId);
}
