import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { unsafeBrandId } from "@knodia/common-models/ids";
import {
  eserviceTemplates,
  getEserviceTemplate,
} from "@knodia/eservice-template-models";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import {
  API_Problem,
  notFoundError,
} from "@knodia/fastify-zod-api-commons/models";

import { apiTags } from "../../models/apiTags.ts";
import {
  API_EserviceTemplateDetails,
  API_EserviceTemplateIdPathParam,
  API_EserviceTemplates,
  API_GetEserviceTemplateQueryParams,
  API_GetEserviceTemplatesQueryParams,
} from "../../models/eservice-template/api.ts";
import {
  toAPI_EserviceTemplate,
  toAPI_EserviceTemplateDetails,
} from "../../models/eservice-template/apiConverter.ts";

export const eserviceTemplateRouter: FastifyPluginAsyncZod = async (
  fastify,
) => {
  fastify.route({
    handler: async (req, res) => {
      const { logger } = getContextValues(requestContext);
      const { knodeId } = req.query;

      logger.info(
        { requestQuery: req.query },
        `Getting E-service templates for Knode ${knodeId}`,
      );

      res.send(eserviceTemplates[knodeId].map(toAPI_EserviceTemplate));
    },
    method: "GET",
    schema: {
      description:
        "Retrieve a list of e-service templates available for a given Knode",
      operationId: "getEserviceTemplates",
      querystring: API_GetEserviceTemplatesQueryParams,
      response: {
        200: API_EserviceTemplates.meta({
          description: "E-service templates retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
      },
      tags: [apiTags.eserviceTemplate],
    },
    url: "/eserviceTemplates",
  });

  fastify.route({
    handler: async (req, res) => {
      const { logger } = getContextValues(requestContext);
      const { templateId } = req.params;
      const { knodeId } = req.query;

      logger.info(
        { requestParams: req.params, requestQuery: req.query },
        `Getting E-service template with ID ${templateId}`,
      );

      const eserviceTemplate = getEserviceTemplate(
        unsafeBrandId(templateId),
        knodeId,
      );

      if (eserviceTemplate === undefined) {
        throw notFoundError(
          `E-service template with ID ${templateId} not found for Knode ${knodeId}`,
        );
      }

      res.send(toAPI_EserviceTemplateDetails(eserviceTemplate));
    },
    method: "GET",
    schema: {
      description: "Retrieve an E-service template with all its details",
      operationId: "getEserviceTemplate",
      params: API_EserviceTemplateIdPathParam,
      querystring: API_GetEserviceTemplateQueryParams,
      response: {
        200: API_EserviceTemplateDetails.meta({
          description: "E-service template retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "E-service template not found" }),
      },
      tags: [apiTags.eserviceTemplate],
    },
    url: "/eserviceTemplates/:templateId",
  });
};
