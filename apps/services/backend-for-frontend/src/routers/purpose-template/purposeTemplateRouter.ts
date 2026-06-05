import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { type EserviceId, unsafeBrandId } from "@knodia/common-models/ids";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import {
  API_Problem,
  getKnodiaServiceHeaders,
} from "@knodia/fastify-zod-api-commons/models";
import { getPurposeTemplates } from "@knodia/purpose-template-models";
import {
  remoteResourcesManagerApi,
  type RemoteResourcesManagerClient,
} from "@knodia/remote-resources-manager-client";

import { apiTags } from "../../models/apiTags.ts";
import {
  API_GetPurposeTemplateQueryParams,
  API_GetPurposeTemplatesQueryParams,
  API_PurposeTemplateDetails,
  API_PurposeTemplateIdPathParam,
  API_PurposeTemplates,
} from "../../models/purpose-template/api.ts";
import {
  toAPI_PurposeTemplate,
  toAPI_PurposeTemplateDetails,
} from "../../models/purpose-template/apiConverter.ts";
import { getUISessionAuthData } from "../../utils/authData.ts";
import { retrievePurposeTemplate } from "../../utils/purposeTemplate.ts";

interface PurposeTemplateRouterOptions {
  remoteResourcesManagerClient: RemoteResourcesManagerClient;
}

export const purposeTemplateRouter: FastifyPluginAsyncZod<
  PurposeTemplateRouterOptions
> = async (fastify, { remoteResourcesManagerClient }) => {
  fastify.route({
    handler: async (req, res) => {
      const { authData, correlationId, logger } =
        getContextValues(requestContext);
      getUISessionAuthData(authData);

      const { eserviceId, knodeId } = req.query;

      const {
        data: { version: formSchemaVersion },
      } = await remoteResourcesManagerApi.getCurrentPurposeFormSchemas({
        client: remoteResourcesManagerClient,
        headers: getKnodiaServiceHeaders(req, correlationId),
        query: { knodeId },
      });

      logger.info(
        { formSchemaVersion, requestQuery: req.query },
        `Getting Purpose Templates for Knode ${knodeId}${
          eserviceId === undefined ? "" : ` filtered by E-service ${eserviceId}`
        } (formSchemaVersion ${formSchemaVersion})`,
      );

      const purposeTemplates = getPurposeTemplates(
        knodeId,
        formSchemaVersion,
        eserviceId === undefined
          ? undefined
          : unsafeBrandId<EserviceId>(eserviceId),
      );

      res.send(purposeTemplates.map(toAPI_PurposeTemplate));
    },
    method: "GET",
    schema: {
      description:
        "Retrieve a list of Purpose Templates available for a given Knode, optionally filtered by E-service",
      operationId: "getPurposeTemplates",
      querystring: API_GetPurposeTemplatesQueryParams,
      response: {
        200: API_PurposeTemplates.meta({
          description: "Purpose Templates retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
      },
      summary: "List Purpose Templates",
      tags: [apiTags.purposeTemplate],
    },
    url: "/purposeTemplates",
  });

  fastify.route({
    handler: async (req, res) => {
      const { authData, logger } = getContextValues(requestContext);
      getUISessionAuthData(authData);

      const { purposeTemplateId } = req.params;
      const { knodeId } = req.query;

      logger.info(
        { requestParams: req.params, requestQuery: req.query },
        `Getting Purpose Template with ID ${purposeTemplateId}`,
      );

      const purposeTemplate = retrievePurposeTemplate(
        unsafeBrandId(purposeTemplateId),
        knodeId,
      );

      res.send(toAPI_PurposeTemplateDetails(purposeTemplate));
    },
    method: "GET",
    schema: {
      description: "Retrieve a Purpose Template with all its details",
      operationId: "getPurposeTemplate",
      params: API_PurposeTemplateIdPathParam,
      querystring: API_GetPurposeTemplateQueryParams,
      response: {
        200: API_PurposeTemplateDetails.meta({
          description: "Purpose Template retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Purpose Template not found" }),
      },
      summary: "Get a Purpose Template",
      tags: [apiTags.purposeTemplate],
    },
    url: "/purposeTemplates/:purposeTemplateId",
  });
};
