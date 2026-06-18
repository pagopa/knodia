import type { EserviceId } from "@knodia/common-models/ids";

import { describe, expect, it } from "vitest";

import {
  consumerArchivedPurposesQuery,
  consumerPurposesByEserviceQuery,
  consumerPurposesQuery,
  producerArchivedPurposesQuery,
  producerPurposesQuery,
} from "./queries";

describe("consumer purposes queries", () => {
  it("filters the active list to Active and Suspended states", () => {
    const opts = consumerPurposesQuery(0);

    expect(opts.queryKey[0]).toMatchObject({
      query: { state: ["Active", "Suspended"] },
    });
  });

  it("filters the per-eservice consumer list to Active and Suspended states", () => {
    const opts = consumerPurposesByEserviceQuery(
      "00000000-0000-4000-8000-000000000001" as EserviceId,
      "Orion",
    );

    expect(opts.queryKey[0]).toMatchObject({
      query: { state: ["Active", "Suspended"] },
    });
  });

  it("filters the archive list to the Archived state only", () => {
    const opts = consumerArchivedPurposesQuery(0);

    expect(opts.queryKey[0]).toMatchObject({
      query: { state: ["Archived"] },
    });
  });
});

describe("producer purposes queries", () => {
  it("filters the active list to Active and Suspended states", () => {
    const opts = producerPurposesQuery(0);

    expect(opts.queryKey[0]).toMatchObject({
      query: { state: ["Active", "Suspended"] },
    });
  });

  it("filters the archive list to the Archived state only", () => {
    const opts = producerArchivedPurposesQuery(0);

    expect(opts.queryKey[0]).toMatchObject({
      query: { state: ["Archived"] },
    });
  });
});
