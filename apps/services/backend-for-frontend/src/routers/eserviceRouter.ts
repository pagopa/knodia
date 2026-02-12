import type { FileManager } from "@knodia/file-manager";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { EserviceInterfaceId, generateId } from "@knodia/common-models/ids";
import { API_EserviceIdPathParam } from "@knodia/eservice-models/api";
import { eserviceProcessApi } from "@knodia/eservice-process-client";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import {
  API_Problem,
  CORRELATION_ID_HEADER,
  genericError,
} from "@knodia/fastify-zod-api-commons/models";

import { type EserviceProcessClient } from "../clients/clientsProvider.ts";
import { config } from "../config/config.ts";
import {
  API_CreatedResource,
  API_EserviceDetails,
  API_Eservices,
  API_EserviceSeed,
  API_EservicesQueryParams,
  API_ProducerEservices,
  API_ProducerEservicesQueryParams,
} from "../models/api.ts";
import {
  toAPI_EserviceDetails,
  toAPI_ProducerEservice,
} from "../models/apiConverter.ts";
import { apiTags } from "../models/apiTags.ts";

interface EserviceRouterOptions {
  eserviceProcessClient: EserviceProcessClient;
  fileManager: FileManager;
}

// TODO: consider adding an eserviceService layer between the bff and the eservice process API, like in PDND.
export const eserviceRouter: FastifyPluginAsyncZod<
  EserviceRouterOptions
> = async (fastify, { eserviceProcessClient, fileManager }) => {
  fastify.route({
    handler: async (req, res) => {
      const { correlationId } = getContextValues(requestContext);
      const { data } = await eserviceProcessApi.getEservices({
        client: eserviceProcessClient,
        headers: {
          [CORRELATION_ID_HEADER]: correlationId,
        },
        query: {
          limit: req.query.limit,
          offset: req.query.offset,
        },
      });

      res.send(data);
    },
    method: "GET",
    schema: {
      description: "Retrieve a list of E-services",
      operationId: "getEservices",
      querystring: API_EservicesQueryParams,
      response: {
        200: API_Eservices.describe("E-services retrieved successfully"),
        400: API_Problem.describe("Bad Request"),
      },
      tags: [apiTags.eservice],
    },
    url: "/eservices",
  });

  fastify.route({
    handler: async (req, res) => {
      const { correlationId } = getContextValues(requestContext);
      const {
        interfaceDocument: { content, name, ...interfaceDocumentRest },
        ...rest
      } = req.body;

      const interfaceDocumentId = generateId<EserviceInterfaceId>();

      const s3Key = await fileManager.storeBytes({
        bucket: config.eserviceInterfacesS3Bucket,
        checksum: interfaceDocumentRest.checksum,
        content: Buffer.from(content, "base64"),
        contentType: interfaceDocumentRest.contentType,
        key: `${interfaceDocumentId}/${name}`,
      });

      const seed: eserviceProcessApi.EserviceSeed = {
        ...rest,
        interfaceDocument: {
          ...interfaceDocumentRest,
          id: interfaceDocumentId,
          name,
          path: s3Key,
        },
      };

      const { data } = await eserviceProcessApi.createEservice({
        body: seed,
        client: eserviceProcessClient,
        headers: {
          [CORRELATION_ID_HEADER]: correlationId,
        },
      });

      res.status(201).send(API_CreatedResource.parse({ id: data.id }));
    },
    method: "POST",
    schema: {
      body: API_EserviceSeed,
      description: "Create a new E-service",
      operationId: "createEservice",
      response: {
        201: API_CreatedResource.describe("E-service created successfully"),
        400: API_Problem.describe("Bad Request"),
      },
      tags: [apiTags.eservice],
    },
    url: "/eservices",
  });

  fastify.route({
    handler: async (req, res) => {
      const { limit, mode, offset, q, sortOrder, state } = req.query;
      const { correlationId } = getContextValues(requestContext);

      // TODO: get real producerId from auth context
      const producerId = "00000000-0000-0000-0000-000000000000";

      // TODO: Implement sorting by activeAgreements/activePurposes.
      // Currently falls back to name sorting. Two options:
      // 1. BFF-side: fetch ALL eservices (no process pagination), enrich, sort, paginate here.
      //    Breaks process pagination; only viable if producer eservice count is bounded.
      // 2. Process-side: get counts in eservice-process and handle sorting.
      //    Breaks unified data model principle (process would include cross-domain data).

      const { data } = await eserviceProcessApi.getEservices({
        client: eserviceProcessClient,
        headers: {
          [CORRELATION_ID_HEADER]: correlationId,
        },
        query: {
          limit,
          mode,
          offset,
          producerId,
          q,
          sortBy: "name",
          sortOrder,
          state,
        },
      });

      // TODO: fetch real counts from agreement-process and purpose-process (maybe batch endpoint)
      const items = data.items.map((eservice, idx) =>
        toAPI_ProducerEservice(eservice, idx + 5, idx + 1),
      );

      res.send({
        items,
        pagination: data.pagination,
      });
    },
    method: "GET",
    schema: {
      description:
        "Retrieve a paginated list of E-services produced by the logged-in user's organization",
      operationId: "getProducerEservices",
      querystring: API_ProducerEservicesQueryParams,
      response: {
        200: API_ProducerEservices.describe(
          "Producer E-services retrieved successfully",
        ),
        400: API_Problem.describe("Bad Request"),
      },
      tags: [apiTags.eservice],
    },
    url: "/producer/eservices",
  });

  fastify.route({
    handler: async (req, res) => {
      const { correlationId } = getContextValues(requestContext);

      const headers = { [CORRELATION_ID_HEADER]: correlationId };
      const path = { eserviceId: req.params.eserviceId };

      const [eserviceResult, versionResult] = await Promise.all([
        eserviceProcessApi.getEserviceById({
          client: eserviceProcessClient,
          headers,
          path,
        }),
        eserviceProcessApi.getEserviceVersion({
          client: eserviceProcessClient,
          headers,
          path,
        }),
      ]);

      if (!eserviceResult.data || !versionResult.data) {
        throw genericError(
          "Unexpected empty response from eservice-process on getEserviceDetails",
        );
      }

      // TODO: fetch real counts from agreement-process and purpose-process
      res.send(
        toAPI_EserviceDetails(eserviceResult.data, versionResult.data, {
          agreements: { active: 3, total: 5 },
          purposes: { active: 1, total: 2 },
        }),
      );
    },
    method: "GET",
    schema: {
      description: "Retrieve an E-service with all its details",
      operationId: "getEserviceDetails",
      params: API_EserviceIdPathParam,
      response: {
        200: API_EserviceDetails.describe(
          "E-service details retrieved successfully",
        ),
        400: API_Problem.describe("Bad Request"),
        404: API_Problem.describe("E-service not found"),
      },
      tags: [apiTags.eservice],
    },
    url: "/eservices/:eserviceId",
  });
};
