import { describe, expect, it } from "vitest";
import { z } from "zod";

import { requireKnodeIdWith } from "../src/api/api.ts";

const KNODE_ID = "Orion";
const UUID = "550e8400-e29b-41d4-a716-446655440000";

const baseSchema = z.object({
  eserviceId: z.uuid().optional(),
  knodeId: z.string().optional(),
  purposeId: z.uuid().optional(),
});

describe("requireKnodeIdWith", () => {
  describe("single field", () => {
    const schema = requireKnodeIdWith("eserviceId")(baseSchema);

    it("accepts the id together with knodeId", () => {
      expect(
        schema.safeParse({ eserviceId: UUID, knodeId: KNODE_ID }).success,
      ).toBe(true);
    });

    it("rejects the id without knodeId", () => {
      expect(schema.safeParse({ eserviceId: UUID }).success).toBe(false);
    });

    it("accepts knodeId on its own", () => {
      expect(schema.safeParse({ knodeId: KNODE_ID }).success).toBe(true);
    });

    it("accepts an empty query", () => {
      expect(schema.safeParse({}).success).toBe(true);
    });
  });

  describe("multiple fields", () => {
    const schema = requireKnodeIdWith("eserviceId", "purposeId")(baseSchema);

    it("requires knodeId when any listed field is set", () => {
      expect(schema.safeParse({ purposeId: UUID }).success).toBe(false);
      expect(
        schema.safeParse({ knodeId: KNODE_ID, purposeId: UUID }).success,
      ).toBe(true);
    });
  });
});
