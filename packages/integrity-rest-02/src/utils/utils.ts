import crypto from "crypto";

export function calculateIntegrityRest02Digest(body: unknown): string {
  let payloadBytes: Buffer;
  if (body === null || body === undefined) {
    payloadBytes = Buffer.alloc(0);
  } else if (Buffer.isBuffer(body)) {
    payloadBytes = body;
  } else if (typeof body === "string") {
    payloadBytes = Buffer.from(body);
  } else {
    const json = JSON.stringify(body);
    payloadBytes = Buffer.from(json);
  }

  return crypto.createHash("sha256").update(payloadBytes).digest("base64");
}
