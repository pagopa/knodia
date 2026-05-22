/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { Eservice } from "@knodia/eservice-models";
import type { API_Problem } from "@knodia/fastify-zod-api-commons/models";

import { type Agreement, AgreementState } from "@knodia/agreement-models";
import { generateExternalId } from "@knodia/common-models/externalResource";
import {
  generateId,
  KnodeId,
  type OrganizationId,
  unsafeBrandId,
} from "@knodia/common-models/ids";
import { type Purpose, PurposeState } from "@knodia/purpose-models";
import {
  TEST_ORGANIZATION_ID,
  type TestToken,
} from "@knodia/test-commons/auth";
import {
  getMockAgreement,
  getMockEservice,
  getMockPurpose,
} from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import { type API_PullResponse, type API_Signal } from "../src/models/api.ts";
import {
  eserviceNotActive,
  eserviceNotFound,
  eserviceSignalHubNotEnabled,
  organizationNotAuthorizedToPullSignals,
} from "../src/models/errors.ts";
import {
  agreementWriterService,
  eserviceWriterService,
  purposeWriterService,
} from "./setup.ts";
import { injectAppRequest } from "./utils.ts";

const producerId = TEST_ORGANIZATION_ID;
const consumerId = generateExternalId<OrganizationId>();

const allowedTestTokens: TestToken[] = [
  {
    organizationId: unsafeBrandId<OrganizationId>(consumerId),
    type: "knode-api",
  },
];

const producerToken: TestToken = {
  organizationId: producerId,
  type: "knode-api",
};

const consumer = {
  id: consumerId,
  knodeId: KnodeId.enum.Orion,
};

const eservice = {
  ...getMockEservice({ latestVersionState: "Active" }),
  isSignalHubEnabled: true,
  producerId,
};

const agreement: Agreement = {
  ...getMockAgreement(),
  consumer,
  eserviceId: eservice.id,
  eserviceVersionId: eservice.versions[0]!.id,
  producerId: eservice.producerId,
  state: AgreementState.enum.Active,
};

const purpose: Purpose = {
  ...getMockPurpose(),
  consumer,
  eserviceId: eservice.id,
  state: PurposeState.enum.Active,
};

const defaultQuery = {
  lastSignalId: "0",
  size: "10",
};

const pullSignal = (query = defaultQuery) =>
  injectAppRequest(allowedTestTokens[0]!)
    .get(`/signals/${eservice.id}`)
    .query(query);

const seedData = async ({
  inputAgreement = agreement,
  inputEservice = eservice,
  inputPurpose = purpose,
} = {}) => {
  await Promise.all([
    eserviceWriterService.upsertEservice(inputEservice, 0),
    agreementWriterService.upsertAgreement(inputAgreement, 0),
    purposeWriterService.upsertPurpose(inputPurpose, 0),
  ]);
};

const pushSignal = (body: API_Signal) =>
  injectAppRequest(producerToken).post("/signals").body(body);

describe("GET /signals/:eserviceId (pullSignal)", () => {
  it("should return 200 with an empty signals list when no signals have been pushed", async () => {
    await seedData();

    const response = await pullSignal();

    expect(response.statusCode).toBe(200);
    expect(response.json<API_PullResponse>()).toEqual({ signals: [] });
  });

  it("should return 200 with signals when signals have been pushed", async () => {
    await seedData();

    const signal: API_Signal = {
      eserviceId: eservice.id,
      objectId: "test-object-id",
      objectType: "test-object-type",
      signalId: 1,
      signalType: "CREATE",
    };
    await pushSignal(signal);

    const response = await pullSignal();

    const expectedResponse: API_PullResponse = {
      lastSignalId: signal.signalId,
      signals: [signal],
    };
    expect(response.statusCode).toBe(200);
    expect(response.json<API_PullResponse>()).toEqual(expectedResponse);
  });

  it("should return 206 when there are more signals to pull", async () => {
    await seedData();

    const signals: API_Signal[] = [];
    const size = 10;
    for (let i = 1; i <= size + 1; i++) {
      const signal: API_Signal = {
        eserviceId: eservice.id,
        objectId: `object-${i}`,
        objectType: "test-object-type",
        signalId: i,
        signalType: "CREATE",
      };
      signals.push(signal);

      await pushSignal(signal);
    }

    const response = await pullSignal({
      lastSignalId: "0",
      size: String(size),
    });

    const expectedResponse: API_PullResponse = {
      lastSignalId: size,
      signals: signals.slice(0, size),
    };
    expect(response.statusCode).toBe(206);
    expect(response.json<API_PullResponse>()).toEqual(expectedResponse);
  });

  it("should return 404 when the e-service does not exist", async () => {
    const response = await injectAppRequest(allowedTestTokens[0]!)
      .get(`/signals/${generateId()}`)
      .query(defaultQuery);

    const error = eserviceNotFound(eservice.id);

    expect(response.statusCode).toBe(404);
    expect(response.json<API_Problem>().title).toEqual(error.title);
  });

  it("should return 409 when signal hub is not enabled for the e-service", async () => {
    const eserviceWithoutSignalHub: Eservice = {
      ...eservice,
      isSignalHubEnabled: false,
    };
    await seedData({ inputEservice: eserviceWithoutSignalHub });

    const response = await pullSignal();

    const error = eserviceSignalHubNotEnabled(eservice.id);
    expect(response.statusCode).toBe(409);
    expect(response.json<API_Problem>().title).toEqual(error.title);
  });

  it("should return 409 when the e-service has no active version", async () => {
    const inactiveEservice: Eservice = {
      ...getMockEservice({ latestVersionState: "Archived" }),
      isSignalHubEnabled: true,
      producerId,
    };
    await seedData({ inputEservice: inactiveEservice });

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .get(`/signals/${inactiveEservice.id}`)
      .query(defaultQuery);

    const error = eserviceNotActive(inactiveEservice.id);
    expect(response.statusCode).toBe(409);
    expect(response.json<API_Problem>().title).toEqual(error.title);
  });

  it.each([
    {
      inputAgreement: { ...agreement, state: AgreementState.enum.Suspended },
      inputPurpose: purpose,
      testCase: "agreement not active",
    },
    {
      inputAgreement: agreement,
      inputPurpose: { ...purpose, state: PurposeState.enum.Suspended },
      testCase: "purpose not active",
    },
  ])(
    "should return 403 when the consumer is not authorized to pull signals: $testCase (seed #%#)",
    async ({ inputAgreement, inputPurpose }) => {
      await seedData({ inputAgreement, inputPurpose });

      const response = await pullSignal();

      const error = organizationNotAuthorizedToPullSignals(
        eservice.id,
        consumer,
      );
      expect(response.statusCode).toBe(403);
      expect(response.json<API_Problem>().title).toEqual(error.title);
    },
  );

  it.each([
    ["size is out of range (too high)", { signalId: "1", size: "101" }],
    ["size is out of range (zero)", { signalId: "0", size: "0" }],
    ["signalId is not a number", { signalId: "abc", size: "10" }],
  ])(
    "should return 400 if the query is not correctly formatted - %s",
    async (_label, query) => {
      const response = await pullSignal(query as never);
      expect(response.statusCode).toBe(400);
    },
  );
});
