import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import {
  agreementProcessApi,
  type AgreementProcessClient,
} from "@knodia/agreement-process-client";
import { KnodeId } from "@knodia/common-models/ids";
import {
  eserviceProcessApi,
  type EserviceProcessClient,
} from "@knodia/eservice-process-client";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import { API_Problem } from "@knodia/fastify-zod-api-commons/models";
import { assertEntityExists } from "@knodia/fastify-zod-api-commons/utils";
import {
  organizationProcessApi,
  type OrganizationProcessClient,
} from "@knodia/organization-process-client";
import { API_PurposeIdPathParam } from "@knodia/purpose-models/api";
import {
  purposeProcessApi,
  type PurposeProcessClient,
} from "@knodia/purpose-process-client";
import {
  remoteResourcesManagerApi,
  type RemoteResourcesManagerClient,
} from "@knodia/remote-resources-manager-client";

import { apiTags } from "../../models/apiTags.ts";
import { API_ProducerPurposeDetails } from "../../models/purpose/api.ts";
import { toAPI_ProducerPurposeDetails } from "../../models/purpose/apiConverter.ts";
import { getUISessionAuthData } from "../../utils/authData.ts";
import { getKnodiaServiceHeaders } from "../../utils/headers.ts";

interface PurposeProducerRouterOptions {
  agreementProcessClient: AgreementProcessClient;
  eserviceProcessClient: EserviceProcessClient;
  knodeId: KnodeId;
  organizationProcessClient: OrganizationProcessClient;
  purposeProcessClient: PurposeProcessClient;
  remoteResourcesManagerClient: RemoteResourcesManagerClient;
}

export const purposeProducerRouter: FastifyPluginAsyncZod<
  PurposeProducerRouterOptions
> = async (
  fastify,
  {
    agreementProcessClient,
    eserviceProcessClient,
    knodeId,
    organizationProcessClient,
    purposeProcessClient,
    remoteResourcesManagerClient,
  },
) => {
  fastify.route({
    handler: async (req, res) => {
      const { authData, correlationId, logger } =
        getContextValues(requestContext);
      const { organizationId: producerId } = getUISessionAuthData(authData);

      logger.info(
        { requestParams: req.params },
        `Getting Producer Purpose with ID ${req.params.purposeId}`,
      );

      const headers = getKnodiaServiceHeaders(req, correlationId);

      const { data: purpose } = await purposeProcessApi.getPurpose({
        client: purposeProcessClient,
        headers,
        path: { purposeId: req.params.purposeId },
      });

      const consumerKnodeId = KnodeId.parse(purpose.consumer.knodeId);

      const [
        { data: eservice },
        { data: latestVersion },
        { data: producer },
        { data: consumer },
        { data: agreements },
      ] = await Promise.all([
        eserviceProcessApi.getEservice({
          client: eserviceProcessClient,
          headers,
          path: { eserviceId: purpose.eserviceId },
        }),
        eserviceProcessApi.getEserviceLatestVersion({
          client: eserviceProcessClient,
          headers,
          path: { eserviceId: purpose.eserviceId },
        }),
        organizationProcessApi.getOrganization({
          client: organizationProcessClient,
          headers,
          path: { organizationId: producerId },
        }),
        remoteResourcesManagerApi.getOrganization({
          client: remoteResourcesManagerClient,
          headers,
          path: { organizationId: purpose.consumer.id },
          query: { knodeId: consumerKnodeId },
        }),
        agreementProcessApi.getAgreements({
          client: agreementProcessClient,
          headers,
          query: {
            consumerId: purpose.consumer.id,
            consumerKnodeId,
            eserviceId: purpose.eserviceId,
            limit: 1,
            offset: 0,
          },
        }),
      ]);

      const agreement = assertEntityExists(
        agreements.results[0],
        `Agreement not found for Purpose ${purpose.id} (eserviceId: ${purpose.eserviceId}, consumerId: ${purpose.consumer.id})`,
      );

      res.status(200).send(
        toAPI_ProducerPurposeDetails({
          agreement,
          consumer,
          eservice,
          latestEserviceVersionState: latestVersion.state,
          maxDailyCallsPerConsumer: latestVersion.maxDailyCallsPerConsumer,
          producer: {
            ...producer,
            knodeId,
          },
          purpose,
        }),
      );
    },
    method: "GET",
    schema: {
      description: "Retrieve a Producer Purpose with details",
      operationId: "getProducerPurposeDetails",
      params: API_PurposeIdPathParam,
      response: {
        200: API_ProducerPurposeDetails.meta({
          description: "Producer Purpose details retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Not Found" }),
      },
      tags: [apiTags.purpose],
    },
    url: "/producer/purposes/:purposeId",
  });
};
