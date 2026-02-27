import type { WithMetadata } from "@knodia/db-readmodel-commons/models";

import { Eservice } from "@knodia/eservice-models";
import { getMockEservice, toExpectEservice } from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import {
  aggregateEservice,
  aggregateEservices,
} from "../src/converters/aggregators.ts";
import { splitEserviceIntoObjectsSQL } from "../src/converters/splitters.ts";
import { createEserviceAggregatorInput } from "./utils.ts";

describe("E-service Aggregators", () => {
  it("should convert E-service SQL objects into an E-service business object", () => {
    const eservice: WithMetadata<Eservice> = {
      data: getMockEservice(),
      metadata: {
        version: 1,
      },
    };

    const eserviceSQLObjects = splitEserviceIntoObjectsSQL(
      eservice.data,
      eservice.metadata.version,
    );

    const aggregatedEservice = aggregateEservice(
      createEserviceAggregatorInput(eserviceSQLObjects),
    );

    expect(aggregatedEservice).toEqual({
      data: toExpectEservice(eservice.data),
      metadata: eservice.metadata,
    } satisfies WithMetadata<Eservice>);
  });

  it("should convert E-services SQL objects into E-services business objects", () => {
    const eservice1: WithMetadata<Eservice> = {
      data: getMockEservice(),
      metadata: {
        version: 1,
      },
    };
    const eservice2: WithMetadata<Eservice> = {
      data: getMockEservice(1),
      metadata: {
        version: 1,
      },
    };

    const eserviceSQLObjects1 = splitEserviceIntoObjectsSQL(
      eservice1.data,
      eservice1.metadata.version,
    );
    const eserviceSQLObjects2 = splitEserviceIntoObjectsSQL(
      eservice2.data,
      eservice2.metadata.version,
    );

    const aggregatedEservices = aggregateEservices([
      ...createEserviceAggregatorInput(eserviceSQLObjects1),
      ...createEserviceAggregatorInput(eserviceSQLObjects2),
    ]);

    expect(aggregatedEservices).toEqual(
      expect.arrayContaining([
        {
          data: toExpectEservice(eservice1.data),
          metadata: eservice1.metadata,
        },
        {
          data: toExpectEservice(eservice2.data),
          metadata: eservice2.metadata,
        },
      ] satisfies WithMetadata<Eservice>[]),
    );
  });
});
