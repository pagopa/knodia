import type { EserviceId } from "@knodia/common-models/ids";

import { describe, expect, it } from "vitest";

import {
  archivedConsumerAgreementsQuery,
  archivedProducerAgreementsQuery,
  producerAgreementsQuery,
  producerRecentAgreementsByEserviceQuery,
} from "./queries";

describe("consumer agreements queries", () => {
  it("filters the archive list to the Archived state only", () => {
    const opts = archivedConsumerAgreementsQuery(0);

    expect(opts.queryKey[0]).toMatchObject({
      query: { state: ["Archived"] },
    });
  });
});

describe("producer agreements queries", () => {
  it("filters the active list to Active and Suspended states", () => {
    const opts = producerAgreementsQuery(0);

    expect(opts.queryKey[0]).toMatchObject({
      query: { state: ["Active", "Suspended"] },
    });
  });

  it("filters the archive list to the Archived state only", () => {
    const opts = archivedProducerAgreementsQuery(0);

    expect(opts.queryKey[0]).toMatchObject({
      query: { state: ["Archived"] },
    });
  });

  it("filters the recently-updated section to Active and Suspended states", () => {
    const opts = producerRecentAgreementsByEserviceQuery(
      "00000000-0000-4000-8000-000000000001" as EserviceId,
    );

    expect(opts.queryKey[0]).toMatchObject({
      query: {
        recentlyUpdated: "true",
        state: ["Active", "Suspended"],
      },
    });
  });
});
