import {
  type KnodeId,
  type OrganizationId,
  type SignupUserId,
  unsafeBrandId,
} from "@knodia/common-models/ids";
import { v5 as uuidv5 } from "uuid";

// Deterministic per-(signup user, Knode) Organization id. Using a stable id as
// the Organization id (and thus the event-store stream id) makes provisioning
// idempotent: a redelivered signup event resolves to the same Organization, and
// the event store rejects a second creation on the same stream. The signup
// user's id (a UUID) is the v5 namespace and the Knode the name, so each Knode
// gets its own deterministic id.
export function externalOrganizationId(
  signupUserId: SignupUserId,
  knodeId: KnodeId,
): OrganizationId {
  return unsafeBrandId<OrganizationId>(uuidv5(knodeId, signupUserId));
}
