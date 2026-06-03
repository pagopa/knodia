import type { KnodeId, SignupUserId } from "@knodia/common-models/ids";

import { createHash } from "node:crypto";

// Frozen RFC 4122 namespace for signup-generated organization idempotency keys.
const NAMESPACE = "5f7c2e9a-1b3d-4e6f-8a0c-2d4f6b8e0a1c";

// Stable per-(signup user, Knode) idempotency key for createOrganization, so a
// redelivery of the same signup event resolves to the same organization instead
// of creating a duplicate. Knode is part of the input because each Knode gets
// its own organization.
export function organizationExternalRequestId(
  signupUserId: SignupUserId,
  knodeId: KnodeId,
): string {
  return uuidV5(`${signupUserId}:${knodeId}`, NAMESPACE);
}

// Deterministic RFC 4122 v5 (namespaced SHA-1) UUID. Hand-rolled to avoid a
// dependency for this single use; pinned by the unit test.
function uuidV5(name: string, namespace: string): string {
  const namespaceBytes = Buffer.from(namespace.replace(/-/g, ""), "hex");
  const bytes = createHash("sha1")
    .update(namespaceBytes)
    .update(name, "utf8")
    .digest()
    .subarray(0, 16);

  // Set the version (5) and RFC 4122 variant. Written with modulo + addition
  // rather than bitwise masks: `% 0x10` keeps the low nibble, `% 0x40` the low
  // 6 bits, then the high bits are offset in.
  bytes.writeUInt8(0x50 + (bytes.readUInt8(6) % 0x10), 6); // version 5
  bytes.writeUInt8(0x80 + (bytes.readUInt8(8) % 0x40), 8); // variant

  const hex = bytes.toString("hex");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
}
