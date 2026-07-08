import type { FileManager } from "@knodia/file-manager";
import type { AxiosResponse } from "axios";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { API_AgreementState } from "@knodia/agreement-models/api";
import {
  agreementProcessApi,
  type AgreementProcessClient,
} from "@knodia/agreement-process-client";
import {
  API_CreatedResource,
  API_FileDownload,
} from "@knodia/common-models/api";
import {
  type EserviceInterfaceId,
  generateId,
  unsafeBrandId,
} from "@knodia/common-models/ids";
import { getEserviceInterfaceFileType } from "@knodia/eservice-models";
import { API_EserviceIdPathParam } from "@knodia/eservice-models/api";
import {
  eserviceProcessApi,
  type EserviceProcessClient,
} from "@knodia/eservice-process-client";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import {
  sanitizeFileName,
  sendFileDownload,
} from "@knodia/fastify-zod-api-commons/http";
import {
  API_Problem,
  getKnodiaServiceHeaders,
  type KnodiaServiceHeaders,
} from "@knodia/fastify-zod-api-commons/models";
import {
  isPolledVersionAtLeastResponseVersion,
  type PollingService,
} from "@knodia/polling";
import { API_PurposeState } from "@knodia/purpose-models/api";
import {
  purposeProcessApi,
  type PurposeProcessClient,
} from "@knodia/purpose-process-client";
import { createHash } from "node:crypto";
import z from "zod";

import type { BffProcessConfig } from "../../config/config.ts";

import { apiTags } from "../../models/apiTags.ts";
import { invalidInterfaceFileName } from "../../models/errors.ts";
import {
  API_EserviceFromScratchSeed,
  API_EserviceFromTemplateSeed,
  API_EservicePatch,
  API_ProducerEserviceDetails,
  API_ProducerEservices,
  API_ProducerEservicesQueryParams,
} from "../../models/eservice/api.ts";
import {
  toAPI_ProducerEservice,
  toAPI_ProducerEserviceDetails,
} from "../../models/eservice/apiConverter.ts";
import { getUISessionAuthData } from "../../utils/authData.ts";
import {
  applyInterfaceDocumentOverrides,
  retrieveEserviceTemplate,
  retrieveEserviceTemplateInterfaceContent,
} from "../../utils/eserviceTemplate.ts";

interface EserviceProducerRouterOptions {
  agreementProcessClient: AgreementProcessClient;
  config: BffProcessConfig;
  eserviceProcessClient: EserviceProcessClient;
  fileManager: FileManager;
  pollingService: PollingService;
  purposeProcessClient: PurposeProcessClient;
}

// TODO: consider adding an eserviceService layer between the bff and the eservice process API, like in PDND.
export const eserviceProducerRouter: FastifyPluginAsyncZod<
  EserviceProducerRouterOptions
  // eslint-disable-next-line max-lines-per-function
> = async (
  fastify,
  {
    agreementProcessClient,
    config,
    eserviceProcessClient,
    fileManager,
    pollingService,
    purposeProcessClient,
  },
) => {
  const retrieveEservice = async (
    eserviceId: string,
    headers: KnodiaServiceHeaders,
  ) =>
    await eserviceProcessApi.getEservice({
      client: eserviceProcessClient,
      headers,
      path: { eserviceId },
    });

  const pollEservice = (
    response: AxiosResponse<API_CreatedResource> | AxiosResponse<void>,
    headers: KnodiaServiceHeaders,
    eserviceId: string,
  ) =>
    pollingService.pollResourceWithMetadata(() =>
      retrieveEservice(eserviceId, headers),
    )({
      condition: isPolledVersionAtLeastResponseVersion(response),
    });

  const pollEserviceById = (
    eserviceId: string,
    response: AxiosResponse<unknown>,
    headers: KnodiaServiceHeaders,
  ) =>
    pollingService.pollResourceWithMetadata(() =>
      retrieveEservice(eserviceId, headers),
    )({
      condition: isPolledVersionAtLeastResponseVersion(response),
    });

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info(
        { requestBody: req.body },
        "Creating new E-service with body data",
      );

      const {
        interfaceDocument: { content, name: rawName, ...interfaceDocumentRest },
        ...rest
      } = req.body;

      const name = sanitizeFileName(rawName);

      if (getEserviceInterfaceFileType(name) === undefined) {
        throw invalidInterfaceFileName(name);
      }

      const headers = getKnodiaServiceHeaders(req, correlationId);

      const interfaceDocumentId = generateId<EserviceInterfaceId>();

      const s3Key = await fileManager.storeBytes({
        bucket: config.eserviceInterfacesS3Bucket,
        checksumSHA256Hex: interfaceDocumentRest.checksum,
        content: Buffer.from(content, "base64"),
        contentType: interfaceDocumentRest.contentType,
        key: `${interfaceDocumentId}/${name}`,
      });

      const seed: eserviceProcessApi.EserviceFromScratchSeed = {
        ...rest,
        interfaceDocument: {
          ...interfaceDocumentRest,
          id: interfaceDocumentId,
          name,
          path: s3Key,
        },
      };

      const response = await eserviceProcessApi.createEservice({
        body: seed,
        client: eserviceProcessClient,
        headers,
      });

      await pollEservice(response, headers, response.data.id);

      res.status(201).send({ id: response.data.id });
    },
    method: "POST",
    schema: {
      body: API_EserviceFromScratchSeed,
      description: "Create a new E-service",
      operationId: "createEservice",
      response: {
        201: API_CreatedResource.meta({
          description: "E-service created successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        429: API_Problem.meta({ description: "Too Many Requests" }),
      },
      tags: [apiTags.eservice],
    },
    url: "/producer/eservices",
  });

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info(
        { requestBody: req.body },
        "Creating new E-service from template with body data",
      );

      const headers = getKnodiaServiceHeaders(req, correlationId);

      const template = retrieveEserviceTemplate(
        unsafeBrandId(req.body.template.id),
        req.body.template.knodeId,
      );
      const templateInterfaceContent =
        retrieveEserviceTemplateInterfaceContent(template);

      const overriddenInterfaceContent = applyInterfaceDocumentOverrides({
        content: templateInterfaceContent,
        fileName: template.eserviceFields.interfaceDocument.name,
        overrides: req.body.interfaceDocumentOverrides,
      });

      const checksum = createHash("sha256")
        .update(overriddenInterfaceContent)
        .digest("hex");

      const interfaceDocumentId = generateId<EserviceInterfaceId>();

      const s3Key = await fileManager.storeBytes({
        bucket: config.eserviceInterfacesS3Bucket,
        checksumSHA256Hex: checksum,
        content: overriddenInterfaceContent,
        contentType: template.eserviceFields.interfaceDocument.contentType,
        key: `${interfaceDocumentId}/${template.eserviceFields.interfaceDocument.name}`,
      });

      const seed: eserviceProcessApi.EserviceFromTemplateSeed = {
        accessTokenAudience: req.body.accessTokenAudience,
        accessTokenDuration: req.body.accessTokenDuration,
        accessTokenType: req.body.accessTokenType,
        description: req.body.description,
        interfaceDocument: {
          checksum,
          contentType: template.eserviceFields.interfaceDocument.contentType,
          id: interfaceDocumentId,
          name: template.eserviceFields.interfaceDocument.name,
          path: s3Key,
          prettyName: template.eserviceFields.interfaceDocument.prettyName,
        },
        isSignalHubEnabled: req.body.isSignalHubEnabled,
        maxDailyCallsPerConsumer: req.body.maxDailyCallsPerConsumer,
        maxDailyCallsPerKnode: req.body.maxDailyCallsPerKnode,
        name: req.body.name,
        template: req.body.template,
      };

      const response = await eserviceProcessApi.createEservice({
        body: seed,
        client: eserviceProcessClient,
        headers,
      });

      await pollEservice(response, headers, response.data.id);

      res.status(201).send({ id: response.data.id });
    },
    method: "POST",
    schema: {
      body: API_EserviceFromTemplateSeed,
      description: "Create a new E-service from a Template",
      operationId: "createEserviceFromTemplate",
      response: {
        201: API_CreatedResource.meta({
          description: "E-service created successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "E-service template not found" }),
        429: API_Problem.meta({ description: "Too Many Requests" }),
      },
      tags: [apiTags.eservice],
    },
    url: "/producer/eservices/fromTemplate",
  });

  fastify.route({
    handler: async (req, res) => {
      const { authData, correlationId, logger } =
        getContextValues(requestContext);
      const { organizationId: producerId } = getUISessionAuthData(authData);

      logger.info(
        { requestQuery: req.query },
        "Getting E-services with query parameters",
      );

      const { limit, mode, offset, q, sortBy, sortOrder, state } = req.query;

      // TODO: Implement sorting by activeAgreements/activePurposes.
      // Currently falls back to name sorting. Two options:
      // 1. BFF-side: fetch ALL eservices (no process pagination), enrich, sort, paginate here.
      //    Breaks process pagination; only viable if producer eservice count is bounded.
      // 2. Process-side: get counts in eservice-process and handle sorting.
      //    Breaks unified data model principle (process would include cross-domain data).

      const headers = getKnodiaServiceHeaders(req, correlationId);

      const { data } = await eserviceProcessApi.getEservices({
        client: eserviceProcessClient,
        headers,
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

      const results = await Promise.all(
        data.results.map(async (eservice) => {
          const [
            { data: latestEserviceVersion },
            { data: agreements },
            { data: purposes },
          ] = await Promise.all([
            eserviceProcessApi.getEserviceLatestVersion({
              client: eserviceProcessClient,
              headers,
              path: { eserviceId: eservice.id },
            }),
            agreementProcessApi.getAgreements({
              client: agreementProcessClient,
              headers,
              query: {
                eserviceId: eservice.id,
                limit: 1,
                offset: 0,
                state: [API_AgreementState.enum.Active],
              },
            }),
            purposeProcessApi.getPurposes({
              client: purposeProcessClient,
              headers,
              query: {
                eserviceId: eservice.id,
                limit: 1,
                offset: 0,
                state: [API_PurposeState.enum.Active],
              },
            }),
          ]);

          return toAPI_ProducerEservice({
            activeAgreements: agreements.pagination.total,
            activePurposes: purposes.pagination.total,
            eservice,
            state: latestEserviceVersion.state,
          });
        }),
      );

      res.send({
        pagination: data.pagination,
        results,
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
          description: "E-services retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        429: API_Problem.meta({ description: "Too Many Requests" }),
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
        `Getting E-service with ID ${req.params.eserviceId}`,
      );

      const path = { eserviceId: req.params.eserviceId };
      const headers = getKnodiaServiceHeaders(req, correlationId);

      const [
        { data: eservice },
        { data: latestVersion },
        { data: latestVersionInterface },
        { data: activeAgreements },
        { data: suspendedAgreements },
        { data: activePurposes },
        { data: suspendedPurposes },
        { data: totalDailyCalls },
      ] = await Promise.all([
        eserviceProcessApi.getEservice({
          client: eserviceProcessClient,
          headers,
          path,
        }),
        eserviceProcessApi.getEserviceLatestVersion({
          client: eserviceProcessClient,
          headers,
          path,
        }),
        eserviceProcessApi.getEserviceLatestVersionInterface({
          client: eserviceProcessClient,
          headers,
          path,
        }),
        agreementProcessApi.getAgreements({
          client: agreementProcessClient,
          headers,
          query: {
            eserviceId: req.params.eserviceId,
            limit: 1,
            offset: 0,
            state: [API_AgreementState.enum.Active],
          },
        }),
        agreementProcessApi.getAgreements({
          client: agreementProcessClient,
          headers,
          query: {
            eserviceId: req.params.eserviceId,
            limit: 1,
            offset: 0,
            state: [API_AgreementState.enum.Suspended],
          },
        }),
        purposeProcessApi.getPurposes({
          client: purposeProcessClient,
          headers,
          query: {
            eserviceId: req.params.eserviceId,
            limit: 1,
            offset: 0,
            state: [API_PurposeState.enum.Active],
          },
        }),
        purposeProcessApi.getPurposes({
          client: purposeProcessClient,
          headers,
          query: {
            eserviceId: req.params.eserviceId,
            limit: 1,
            offset: 0,
            state: [API_PurposeState.enum.Suspended],
          },
        }),
        purposeProcessApi.getPurposesTotalDailyCalls({
          client: purposeProcessClient,
          headers,
          query: {
            eserviceId: req.params.eserviceId,
            state: [API_PurposeState.enum.Active],
          },
        }),
      ]);

      res.send(
        toAPI_ProducerEserviceDetails({
          counters: {
            agreements: {
              active: activeAgreements.pagination.total,
              suspended: suspendedAgreements.pagination.total,
            },
            purposes: {
              active: activePurposes.pagination.total,
              suspended: suspendedPurposes.pagination.total,
              totalApiCallsPerDay: totalDailyCalls.totalDailyCalls,
            },
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
        404: API_Problem.meta({ description: "Not Found" }),
        429: API_Problem.meta({ description: "Too Many Requests" }),
      },
      tags: [apiTags.eservice],
    },
    url: "/producer/eservices/:eserviceId",
  });

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info(
        { requestBody: req.body, requestParams: req.params },
        `Updating E-service with ID ${req.params.eserviceId}`,
      );

      const headers = getKnodiaServiceHeaders(req, correlationId);

      const response = await eserviceProcessApi.updateEservice({
        body: req.body,
        client: eserviceProcessClient,
        headers,
        path: { eserviceId: req.params.eserviceId },
      });

      await pollEserviceById(req.params.eserviceId, response, headers);

      res.status(204).send();
    },
    method: "PATCH",
    schema: {
      body: API_EservicePatch,
      consumes: ["application/merge-patch+json"],
      description: "Update an E-service",
      operationId: "updateProducerEservice",
      params: API_EserviceIdPathParam,
      response: {
        204: z
          .undefined()
          .meta({ description: "E-service updated successfully" }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "E-service not found" }),
        409: API_Problem.meta({ description: "Conflict" }),
        429: API_Problem.meta({ description: "Too Many Requests" }),
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
        `Downloading interface of E-service with ID ${req.params.eserviceId}`,
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

      sendFileDownload({
        content,
        contentType: data.contentType,
        fileName: data.name,
        filePrettyName: data.prettyName.en,
        res,
      });
    },
    method: "GET",
    schema: {
      description:
        "Download the interface document for the latest version of an E-service",
      operationId: "getProducerEserviceLatestVersionInterface",
      params: API_EserviceIdPathParam,
      produces: ["application/json", "application/yaml", "application/x-yaml"],
      response: {
        200: API_FileDownload.meta({
          description: "E-service interface document downloaded successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Not Found" }),
        429: API_Problem.meta({ description: "Too Many Requests" }),
      },
      summary: "Download E-service latest Version Interface",
      tags: [apiTags.eservice],
    },
    url: "/producer/eservices/:eserviceId/interface",
  });

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);
      const { eserviceId } = req.params;

      logger.info(
        { requestParams: req.params },
        `Suspending E-service with ID ${eserviceId}`,
      );

      const headers = getKnodiaServiceHeaders(req, correlationId);

      const response = await eserviceProcessApi.suspendEservice({
        client: eserviceProcessClient,
        headers,
        path: { eserviceId },
      });

      await pollEserviceById(eserviceId, response, headers);

      res.status(204).send();
    },
    method: "POST",
    schema: {
      description: "Suspend an E-service",
      operationId: "suspendEservice",
      params: API_EserviceIdPathParam,
      response: {
        204: z.undefined().meta({
          description: "E-service suspended successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Not Found" }),
        409: API_Problem.meta({ description: "Conflict" }),
        429: API_Problem.meta({ description: "Too Many Requests" }),
      },
      tags: [apiTags.eservice],
    },
    url: "/producer/eservices/:eserviceId/suspend",
  });

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);
      const { eserviceId } = req.params;

      logger.info(
        { requestParams: req.params },
        `Reactivating E-service with ID ${eserviceId}`,
      );

      const headers = getKnodiaServiceHeaders(req, correlationId);

      const response = await eserviceProcessApi.reactivateEservice({
        client: eserviceProcessClient,
        headers,
        path: { eserviceId },
      });

      await pollEserviceById(eserviceId, response, headers);

      res.status(204).send();
    },
    method: "POST",
    schema: {
      description: "Reactivate a suspended E-service",
      operationId: "reactivateEservice",
      params: API_EserviceIdPathParam,
      response: {
        204: z.undefined().meta({
          description: "E-service reactivated successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Not Found" }),
        409: API_Problem.meta({ description: "Conflict" }),
        429: API_Problem.meta({ description: "Too Many Requests" }),
      },
      tags: [apiTags.eservice],
    },
    url: "/producer/eservices/:eserviceId/reactivate",
  });

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);
      const { eserviceId } = req.params;

      logger.info(
        { requestParams: req.params },
        `Archiving E-service with ID ${eserviceId}`,
      );

      const headers = getKnodiaServiceHeaders(req, correlationId);

      const response = await eserviceProcessApi.archiveEservice({
        client: eserviceProcessClient,
        headers,
        path: { eserviceId },
      });

      await pollEserviceById(eserviceId, response, headers);

      res.status(204).send();
    },
    method: "POST",
    schema: {
      description: "Archive an E-service",
      operationId: "archiveProducerEservice",
      params: API_EserviceIdPathParam,
      response: {
        204: z.undefined().meta({
          description: "E-service archived successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Not Found" }),
        409: API_Problem.meta({ description: "Conflict" }),
        429: API_Problem.meta({ description: "Too Many Requests" }),
      },
      tags: [apiTags.eservice],
    },
    url: "/producer/eservices/:eserviceId/archive",
  });
};
