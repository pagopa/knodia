import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { API_FileDownload } from "@knodia/common-models/api";
import { unsafeBrandId } from "@knodia/common-models/ids";
import { getEserviceTemplates } from "@knodia/eservice-template-models";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import { sendFileDownload } from "@knodia/fastify-zod-api-commons/http";
import { API_Problem } from "@knodia/fastify-zod-api-commons/models";

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
import { getUISessionAuthData } from "../../utils/authData.ts";
import {
  retrieveEserviceTemplate,
  retrieveEserviceTemplateInterfaceContent,
} from "../../utils/eserviceTemplate.ts";

export const eserviceTemplateRouter: FastifyPluginAsyncZod = async (
  fastify,
) => {
  fastify.route({
    handler: async (req, res) => {
      const { authData, logger } = getContextValues(requestContext);
      getUISessionAuthData(authData);
      const { knodeId } = req.query;

      logger.info(
        { requestQuery: req.query },
        `Getting E-service templates for Knode ${knodeId}`,
      );

      const eserviceTemplates = getEserviceTemplates(knodeId);

      res.send(eserviceTemplates.map(toAPI_EserviceTemplate));
    },
    method: "GET",
    schema: {
      description:
        "Retrieve a list of E-Service Templates available for a given Knode",
      operationId: "getEserviceTemplates",
      querystring: API_GetEserviceTemplatesQueryParams,
      response: {
        200: API_EserviceTemplates.meta({
          description: "E-service Templates retrieved successfully",
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
      const { authData, logger } = getContextValues(requestContext);
      getUISessionAuthData(authData);

      const { eserviceTemplateId } = req.params;
      const { knodeId } = req.query;

      logger.info(
        { requestParams: req.params, requestQuery: req.query },
        `Getting E-service template with ID ${eserviceTemplateId}`,
      );

      const eserviceTemplate = retrieveEserviceTemplate(
        unsafeBrandId(eserviceTemplateId),
        knodeId,
      );

      res.send(toAPI_EserviceTemplateDetails(eserviceTemplate));
    },
    method: "GET",
    schema: {
      description: "Retrieve an E-service Template with all its details",
      operationId: "getEserviceTemplate",
      params: API_EserviceTemplateIdPathParam,
      querystring: API_GetEserviceTemplateQueryParams,
      response: {
        200: API_EserviceTemplateDetails.meta({
          description: "E-service Template retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "E-service template not found" }),
      },
      tags: [apiTags.eserviceTemplate],
    },
    url: "/eserviceTemplates/:eserviceTemplateId",
  });

  fastify.route({
    handler: async (req, res) => {
      const { authData, logger } = getContextValues(requestContext);
      getUISessionAuthData(authData);

      const { eserviceTemplateId } = req.params;
      const { knodeId } = req.query;

      logger.info(
        { requestParams: req.params, requestQuery: req.query },
        `Downloading interface of E-service Template with ID ${eserviceTemplateId}`,
      );

      const eserviceTemplate = retrieveEserviceTemplate(
        unsafeBrandId(eserviceTemplateId),
        knodeId,
      );

      const interfaceDocument =
        eserviceTemplate.eserviceFields.interfaceDocument;
      const interfaceContent =
        retrieveEserviceTemplateInterfaceContent(eserviceTemplate);

      sendFileDownload(
        res,
        interfaceContent,
        interfaceDocument.name,
        interfaceDocument.contentType,
      );
    },
    method: "GET",
    schema: {
      description: "Download the interface document for an E-service Template",
      operationId: "downloadEserviceTemplateInterface",
      params: API_EserviceTemplateIdPathParam,
      produces: ["application/json", "application/yaml", "application/x-yaml"],
      querystring: API_GetEserviceTemplateQueryParams,
      response: {
        200: API_FileDownload.meta({
          description:
            "E-service Template interface document downloaded successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Not Found" }),
      },
      summary: "Download E-service Template interface",
      tags: [apiTags.eserviceTemplate],
    },
    url: "/eserviceTemplates/:eserviceTemplateId/interface",
  });
};
