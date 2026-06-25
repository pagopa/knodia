import type { WithMetadata } from "@knodia/db-readmodel-commons/models";

import { type Eservice, type FlatEservice } from "@knodia/eservice-models";
import {
  getMockEservice,
  getMockPurposeFormOption,
  toExpectEservice,
} from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import {
  aggregateEservice,
  aggregateEservices,
  aggregateFlatEservice,
  aggregateFlatEservices,
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
      data: getMockEservice({ seed: 1 }),
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

  it("should preserve receiveDataConfig.purposeFormOptions in the split→aggregate roundtrip", () => {
    const purposeFormOptions = [
      getMockPurposeFormOption(0),
      getMockPurposeFormOption(1),
    ];
    const eservice: WithMetadata<Eservice> = {
      data: getMockEservice({ purposeFormOptions }),
      metadata: { version: 1 },
    };

    const eserviceSQLObjects = splitEserviceIntoObjectsSQL(
      eservice.data,
      eservice.metadata.version,
    );

    const aggregatedEservice = aggregateEservice(
      createEserviceAggregatorInput(eserviceSQLObjects),
    );

    expect(
      aggregatedEservice?.data.receiveDataConfig?.purposeFormOptions,
    ).toHaveLength(purposeFormOptions.length);
    expect(aggregatedEservice?.data.receiveDataConfig).toEqual({
      purposeFormOptions: expect.arrayContaining(purposeFormOptions),
    });
  });

  it("should produce receiveDataConfig=undefined when no purposeFormOptions SQL rows are present", () => {
    const eservice: WithMetadata<Eservice> = {
      data: getMockEservice(),
      metadata: { version: 1 },
    };

    const eserviceSQLObjects = splitEserviceIntoObjectsSQL(
      eservice.data,
      eservice.metadata.version,
    );

    const aggregatedEservice = aggregateEservice(
      createEserviceAggregatorInput(eserviceSQLObjects),
    );

    expect(aggregatedEservice?.data.receiveDataConfig).toBeUndefined();
  });
});

describe("aggregateFlatEservice", () => {
  it("should return undefined for empty input", () => {
    expect(aggregateFlatEservice([])).toBeUndefined();
  });

  it("should produce a FlatEservice with categories and without versions or receiveDataConfig, even when versions/interfaces/requiredAttributes/purposeFormOptions are in the input rows", () => {
    const purposeFormOptions = [getMockPurposeFormOption(0)];
    const eservice: WithMetadata<Eservice> = {
      data: getMockEservice({ purposeFormOptions }),
      metadata: { version: 1 },
    };

    const eserviceSQLObjects = splitEserviceIntoObjectsSQL(
      eservice.data,
      eservice.metadata.version,
    );

    expect(eserviceSQLObjects.eserviceVersionsSQL.length).toBeGreaterThan(0);
    expect(eserviceSQLObjects.eserviceInterfacesSQL.length).toBeGreaterThan(0);
    expect(
      eserviceSQLObjects.eservicePurposeFormOptionSQL.length,
    ).toBeGreaterThan(0);

    const aggregated = aggregateFlatEservice(
      createEserviceAggregatorInput(eserviceSQLObjects),
    );

    expect(aggregated).toBeDefined();
    expect(aggregated?.metadata).toEqual(eservice.metadata);
    expect(aggregated?.data).not.toHaveProperty("versions");
    expect(aggregated?.data).not.toHaveProperty("receiveDataConfig");

    expect(aggregated?.data.id).toBe(eservice.data.id);
    expect(aggregated?.data.name).toEqual(eservice.data.name);
    expect(aggregated?.data.description).toEqual(eservice.data.description);
    expect(aggregated?.data.mode).toBe(eservice.data.mode);
    expect(aggregated?.data.producerId).toBe(eservice.data.producerId);
    expect(aggregated?.data.createdAt).toEqual(eservice.data.createdAt);
    expect(aggregated?.data.updatedAt).toEqual(eservice.data.updatedAt);
    expect(aggregated?.data.isConsumerOperatorIdentificationRequired).toBe(
      eservice.data.isConsumerOperatorIdentificationRequired,
    );
    expect(aggregated?.data.isSignalHubEnabled).toBe(
      eservice.data.isSignalHubEnabled,
    );
    expect(aggregated?.data.categories).toEqual(
      expect.arrayContaining(eservice.data.categories),
    );
    expect(aggregated?.data.categories).toHaveLength(
      eservice.data.categories.length,
    );
  });

  it("should deduplicate rows that carry the same category for the same e-service", () => {
    const eservice: WithMetadata<Eservice> = {
      data: getMockEservice(),
      metadata: { version: 1 },
    };

    const eserviceSQLObjects = splitEserviceIntoObjectsSQL(
      eservice.data,
      eservice.metadata.version,
    );

    const rows = createEserviceAggregatorInput(eserviceSQLObjects);
    const duplicatedRows = [...rows, ...rows];

    const aggregated = aggregateFlatEservice(duplicatedRows);

    expect(aggregated).toBeDefined();
    expect(aggregated?.data.categories).toHaveLength(
      eservice.data.categories.length,
    );
    expect(aggregated?.data.categories).toEqual(
      expect.arrayContaining(eservice.data.categories),
    );
  });

  it("should include all distinct categories for the same e-service", () => {
    const eservice: WithMetadata<Eservice> = {
      data: getMockEservice({ minArrayLength: 2 }),
      metadata: { version: 1 },
    };

    expect(eservice.data.categories.length).toBeGreaterThanOrEqual(2);

    const eserviceSQLObjects = splitEserviceIntoObjectsSQL(
      eservice.data,
      eservice.metadata.version,
    );

    const aggregated = aggregateFlatEservice(
      createEserviceAggregatorInput(eserviceSQLObjects),
    );

    expect(aggregated?.data.categories).toHaveLength(
      eservice.data.categories.length,
    );
    expect(aggregated?.data.categories).toEqual(
      expect.arrayContaining(eservice.data.categories),
    );
  });

  it("should throw when the input contains multiple distinct e-services", () => {
    const eservice1: WithMetadata<Eservice> = {
      data: getMockEservice(),
      metadata: { version: 1 },
    };
    const eservice2: WithMetadata<Eservice> = {
      data: getMockEservice({ seed: 1 }),
      metadata: { version: 1 },
    };

    const eserviceSQLObjects1 = splitEserviceIntoObjectsSQL(
      eservice1.data,
      eservice1.metadata.version,
    );
    const eserviceSQLObjects2 = splitEserviceIntoObjectsSQL(
      eservice2.data,
      eservice2.metadata.version,
    );

    expect(() =>
      aggregateFlatEservice([
        ...createEserviceAggregatorInput(eserviceSQLObjects1),
        ...createEserviceAggregatorInput(eserviceSQLObjects2),
      ]),
    ).toThrow();
  });
});

describe("aggregateFlatEservices", () => {
  it("should return an empty array for empty input", () => {
    expect(aggregateFlatEservices([])).toEqual([]);
  });

  it("should produce a flat e-service per distinct e-service, each with its own categories and without versions or receiveDataConfig", () => {
    const eservice1: WithMetadata<Eservice> = {
      data: getMockEservice(),
      metadata: { version: 1 },
    };
    const eservice2: WithMetadata<Eservice> = {
      data: getMockEservice({ seed: 1 }),
      metadata: { version: 1 },
    };

    const eserviceSQLObjects1 = splitEserviceIntoObjectsSQL(
      eservice1.data,
      eservice1.metadata.version,
    );
    const eserviceSQLObjects2 = splitEserviceIntoObjectsSQL(
      eservice2.data,
      eservice2.metadata.version,
    );

    const aggregated = aggregateFlatEservices([
      ...createEserviceAggregatorInput(eserviceSQLObjects1),
      ...createEserviceAggregatorInput(eserviceSQLObjects2),
    ]);

    expect(aggregated).toHaveLength(2);

    aggregated.forEach((item) => {
      expect(item.data).not.toHaveProperty("versions");
      expect(item.data).not.toHaveProperty("receiveDataConfig");
    });

    const aggregated1 = aggregated.find(
      (item) => item.data.id === eservice1.data.id,
    );
    const aggregated2 = aggregated.find(
      (item) => item.data.id === eservice2.data.id,
    );

    expect(aggregated1).toBeDefined();
    expect(aggregated2).toBeDefined();

    expect(aggregated1?.data.categories).toHaveLength(
      eservice1.data.categories.length,
    );
    expect(aggregated1?.data.categories).toEqual(
      expect.arrayContaining(eservice1.data.categories),
    );

    expect(aggregated2?.data.categories).toHaveLength(
      eservice2.data.categories.length,
    );
    expect(aggregated2?.data.categories).toEqual(
      expect.arrayContaining(eservice2.data.categories),
    );
  });

  it("should ignore versions, interfaces, requiredAttributes and purposeFormOptions present in the rows", () => {
    const eservice1: WithMetadata<Eservice> = {
      data: getMockEservice({
        purposeFormOptions: [getMockPurposeFormOption(0)],
      }),
      metadata: { version: 1 },
    };
    const eservice2: WithMetadata<Eservice> = {
      data: getMockEservice({
        purposeFormOptions: [getMockPurposeFormOption(1)],
        seed: 1,
      }),
      metadata: { version: 1 },
    };

    const eserviceSQLObjects1 = splitEserviceIntoObjectsSQL(
      eservice1.data,
      eservice1.metadata.version,
    );
    const eserviceSQLObjects2 = splitEserviceIntoObjectsSQL(
      eservice2.data,
      eservice2.metadata.version,
    );

    expect(eserviceSQLObjects1.eserviceVersionsSQL.length).toBeGreaterThan(0);
    expect(eserviceSQLObjects2.eserviceVersionsSQL.length).toBeGreaterThan(0);

    const aggregated: WithMetadata<FlatEservice>[] = aggregateFlatEservices([
      ...createEserviceAggregatorInput(eserviceSQLObjects1),
      ...createEserviceAggregatorInput(eserviceSQLObjects2),
    ]);

    expect(aggregated).toHaveLength(2);
    aggregated.forEach((item) => {
      expect(item.data).not.toHaveProperty("versions");
      expect(item.data).not.toHaveProperty("receiveDataConfig");
    });
  });
});
