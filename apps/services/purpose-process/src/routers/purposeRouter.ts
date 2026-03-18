import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { unsafeBrandExternalId } from "@knodia/common-models/externalResource";
import { KnodeId, unsafeBrandId } from "@knodia/common-models/ids";
import { validateAuthorization } from "@knodia/fastify-zod-api-commons/auth";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import {
  API_Problem,
  KnodiaServiceHeaders,
} from "@knodia/fastify-zod-api-commons/models";
import { API_PurposeIdPathParam } from "@knodia/purpose-models/api";

import type { PurposeService } from "../services/purposeService.ts";

import { API_Purpose, API_PurposeSeed } from "../models/api.ts";
import { toAPI_Purpose } from "../models/apiConverter.ts";
import { apiTags } from "../models/apiTags.ts";

interface PurposeRouterOptions {
  purposeService: PurposeService;
}

export const purposeRouter: FastifyPluginAsyncZod<
  PurposeRouterOptions
> = async (fastify, { purposeService }) => {
  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "internal" },
      ]);

      const purpose = await purposeService.createPurpose(
        {
          consumer: {
            id: unsafeBrandExternalId(req.body.consumer.id),
            knodeId: KnodeId.parse(req.body.consumer.knodeId),
          },
          dailyCalls: req.body.dailyCalls,
          description: req.body.description,
          eserviceId: unsafeBrandId(req.body.eserviceId),
          formAnswersJson: req.body.formAnswersJson,
          name: req.body.name,
        },
        ctx,
      );

      res.status(201).send(toAPI_Purpose(purpose));
    },
    method: "POST",
    schema: {
      body: API_PurposeSeed,
      description: "Create a new Purpose",
      headers: KnodiaServiceHeaders,
      operationId: "createPurpose",
      response: {
        201: API_Purpose.meta({
          description: "Purpose created successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Not Found" }),
        409: API_Problem.meta({ description: "Conflict" }),
      },
      tags: [apiTags.purpose],
    },
    url: "/purposes",
  });

  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        {
          tokenType: "ui-session",
          userRoles: ["administrative", "technical"],
        },
      ]);

      const purpose = await purposeService.getPurpose(
        req.params.purposeId,
        ctx,
      );

      res.status(200).send(toAPI_Purpose(purpose));
    },
    method: "GET",
    schema: {
      description: "Retrieve a Purpose by its ID",
      headers: KnodiaServiceHeaders,
      operationId: "getPurpose",
      params: API_PurposeIdPathParam,
      response: {
        200: API_Purpose.meta({
          description: "Purpose retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Purpose not found" }),
      },
      tags: [apiTags.purpose],
    },
    url: "/purposes/:purposeId",
  });
};
