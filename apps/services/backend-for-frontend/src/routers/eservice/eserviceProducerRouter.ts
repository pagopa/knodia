import type { FileManager } from "@knodia/file-manager";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import {
  EserviceInterfaceId,
  generateId,
  OrganizationId,
  unsafeBrandId,
} from "@knodia/common-models/ids";
import { API_EserviceIdPathParam } from "@knodia/eservice-models/api";
import {
  eserviceProcessApi,
  type EserviceProcessClient,
} from "@knodia/eservice-process-client";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import { API_Problem } from "@knodia/fastify-zod-api-commons/models";

import { config } from "../../config/config.ts";
import {
  API_CreatedResource,
  API_EserviceSeed,
  API_FileDownload,
  API_ProducerEserviceDetails,
  API_ProducerEservices,
  API_ProducerEservicesQueryParams,
} from "../../models/api.ts";
import {
  toAPI_ProducerEservice,
  toAPI_ProducerEserviceDetails,
} from "../../models/apiConverter.ts";
import { apiTags } from "../../models/apiTags.ts";
import { getKnodiaServiceHeaders } from "../../utils/headers.ts";

interface EserviceRouterOptions {
  eserviceProcessClient: EserviceProcessClient;
  fileManager: FileManager;
}

// TODO: consider adding an eserviceService layer between the bff and the eservice process API, like in PDND.
export const eserviceProducerRouter: FastifyPluginAsyncZod<
  EserviceRouterOptions
  // eslint-disable-next-line max-lines-per-function
> = async (fastify, { eserviceProcessClient, fileManager }) => {
  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info(
        { requestBody: req.body },
        "Creating new E-service with body data",
      );

      const {
        interfaceDocument: { content, name, ...interfaceDocumentRest },
        ...rest
      } = req.body;

      const interfaceDocumentId = generateId<EserviceInterfaceId>();

      const s3Key = await fileManager.storeBytes({
        bucket: config.eserviceInterfacesS3Bucket,
        checksumSHA256Hex: interfaceDocumentRest.checksum,
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
        headers: getKnodiaServiceHeaders(req, correlationId),
      });
      res.status(201).send(API_CreatedResource.parse({ id: data.id }));
    },
    method: "POST",
    schema: {
      body: API_EserviceSeed,
      description: "Create a new E-service",
      operationId: "createEservice",
      response: {
        201: API_CreatedResource.meta({
          description: "E-service created successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
      },
      tags: [apiTags.eservice],
    },
    url: "/producer/eservices",
  });

  fastify.route({
    handler: async (req, res) => {
      const { logger } = getContextValues(requestContext);

      logger.info(
        { query: req.query },
        "Getting Producer E-services with query parameters",
      );

      const { limit, mode, offset, q, sortBy, sortOrder, state } = req.query;
      const { correlationId } = getContextValues(requestContext);

      // TODO: get real producerId from auth context
      const producerId = unsafeBrandId<OrganizationId>(
        "00000000-0000-0000-0000-000000000000",
      );

      // TODO: Implement sorting by activeAgreements/activePurposes.
      // Currently falls back to name sorting. Two options:
      // 1. BFF-side: fetch ALL eservices (no process pagination), enrich, sort, paginate here.
      //    Breaks process pagination; only viable if producer eservice count is bounded.
      // 2. Process-side: get counts in eservice-process and handle sorting.
      //    Breaks unified data model principle (process would include cross-domain data).

      const { data } = await eserviceProcessApi.getEservices({
        client: eserviceProcessClient,
        headers: getKnodiaServiceHeaders(req, correlationId),
        query: {
          limit,
          mode,
          offset,
          producerId,
          q,
          sortBy,
          sortOrder,
          state,
        },
      });

      // TODO: fetch real counts from agreement-process and purpose-process (maybe batch endpoint)
      const items = await Promise.all(
        data.items.map(async (eservice, idx) => {
          const { data: latestEserviceVersion } =
            await eserviceProcessApi.getEserviceLatestVersion({
              client: eserviceProcessClient,
              headers: getKnodiaServiceHeaders(req, correlationId),
              path: { eserviceId: eservice.id },
            });

          return toAPI_ProducerEservice({
            activeAgreements: idx + 5,
            activePurposes: idx + 1,
            eservice,
            state: latestEserviceVersion.state,
          });
        }),
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
        200: API_ProducerEservices.meta({
          description: "Producer E-services retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
      },
      tags: [apiTags.eservice],
    },
    url: "/producer/eservices",
  });

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info(
        { requestParams: req.params },
        `Getting Producer E-service with ID ${req.params.eserviceId}`,
      );

      const path = { eserviceId: req.params.eserviceId };

      const [
        { data: eservice },
        { data: latestVersion },
        { data: latestVersionInterface },
      ] = await Promise.all([
        eserviceProcessApi.getEservice({
          client: eserviceProcessClient,
          headers: getKnodiaServiceHeaders(req, correlationId),
          path,
        }),
        eserviceProcessApi.getEserviceLatestVersion({
          client: eserviceProcessClient,
          headers: getKnodiaServiceHeaders(req, correlationId),
          path,
        }),
        eserviceProcessApi.getEserviceLatestVersionInterface({
          client: eserviceProcessClient,
          headers: getKnodiaServiceHeaders(req, correlationId),
          path,
        }),
      ]);

      // TODO: fetch real counts from agreement-process and purpose-process
      res.send(
        toAPI_ProducerEserviceDetails({
          counters: {
            agreements: { active: 3, total: 5 },
            purposes: { active: 1, total: 2, totalApiCallsPerDay: 15000 },
          },
          eservice,
          latestVersion,
          latestVersionInterface,
        }),
      );
    },
    method: "GET",
    schema: {
      description: "Retrieve an E-service with all its details",
      operationId: "getProducerEserviceDetails",
      params: API_EserviceIdPathParam,
      response: {
        200: API_ProducerEserviceDetails.meta({
          description: "E-service details retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "E-service not found" }),
      },
      tags: [apiTags.eservice],
    },
    url: "/producer/eservices/:eserviceId",
  });

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info(
        { requestParams: req.params },
        `Downloading interface of Producer E-service with ID ${req.params.eserviceId}`,
      );

      const { data } =
        await eserviceProcessApi.getEserviceLatestVersionInterface({
          client: eserviceProcessClient,
          headers: getKnodiaServiceHeaders(req, correlationId),
          path: {
            eserviceId: req.params.eserviceId,
          },
        });

      const { content } = await fileManager.getBytes({
        bucket: config.eserviceInterfacesS3Bucket,
        key: data.path,
      });

      res.raw.writeHead(200, {
        "Content-Disposition": `attachment; filename="${data.name}"`,
        "Content-Type": data.contentType,
      });
      res.raw.end(content);
    },
    method: "GET",
    schema: {
      description:
        "Download the interface document for the latest version of an E-service",
      operationId: "getProducerEserviceLatestVersionInterface",
      params: API_EserviceIdPathParam,
      produces: ["application/octet-stream"],
      response: {
        200: API_FileDownload.meta({
          description: "E-service interface document downloaded successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Not Found" }),
      },
      tags: [apiTags.eservice],
    },
    url: "/producer/eservices/:eserviceId/interface",
  });
};
