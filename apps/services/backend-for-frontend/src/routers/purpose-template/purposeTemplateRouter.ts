import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { unsafeBrandId } from "@knodia/common-models/ids";
import { validateAuthorization } from "@knodia/fastify-zod-api-commons/auth";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import { API_Problem } from "@knodia/fastify-zod-api-commons/models";
import { getPurposeTemplates } from "@knodia/purpose-template-models";

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
import { retrievePurposeTemplate } from "../../utils/purposeTemplate.ts";

export const purposeTemplateRouter: FastifyPluginAsyncZod = async (fastify) => {
  fastify.route({
    handler: async (req, res) => {
      const { logger } = validateAuthorization(
        getContextValues(requestContext),
        [{ tokenType: "ui-session", userRoles: ["administrative"] }],
      );

      const { eserviceId, knodeId } = req.query;

      logger.info(
        { requestQuery: req.query },
        `Getting Purpose Templates for Knode ${knodeId}${
          eserviceId === undefined ? "" : ` filtered by E-service ${eserviceId}`
        }`,
      );

      const purposeTemplates = getPurposeTemplates(
        knodeId,
        eserviceId === undefined
          ? undefined
          : { eserviceId: unsafeBrandId(eserviceId) },
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
      tags: [apiTags.purposeTemplate],
    },
    url: "/purposeTemplates",
  });

  fastify.route({
    handler: async (req, res) => {
      const { logger } = validateAuthorization(
        getContextValues(requestContext),
        [{ tokenType: "ui-session", userRoles: ["administrative"] }],
      );

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
      tags: [apiTags.purposeTemplate],
    },
    url: "/purposeTemplates/:purposeTemplateId",
  });
};
