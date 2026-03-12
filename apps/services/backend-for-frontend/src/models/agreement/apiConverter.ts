import type { agreementProcessApi } from "@knodia/agreement-process-client";
import type { API_KnodeId } from "@knodia/common-models/internalApi";
import type { eserviceProcessApi } from "@knodia/eservice-process-client";
import type { Organization } from "@knodia/organization-models";
import type { organizationProcessApi } from "@knodia/organization-process-client";

import type { API_ProducerAgreement } from "./api.ts";

export const toAPI_ProducerAgreement = ({
  agreement,
  consumer,
  eservice,
  producer,
}: {
  agreement: agreementProcessApi.Agreement;
  consumer: Organization; // TODO: update with remoteResourcesManagerApi.Organization when available
  eservice: eserviceProcessApi.Eservice;
  producer?: organizationProcessApi.Organization & { knodeId: API_KnodeId };
}): API_ProducerAgreement => ({
  consumer: {
    id: consumer.id,
    knodeId: agreement.consumer.knodeId,
    name: consumer.name,
  },
  eservice: {
    id: eservice.id,
    name: eservice.name,
  },
  id: agreement.id,
  state: agreement.state,
  ...(producer
    ? {
        producer: {
          id: producer.id,
          knodeId: producer.knodeId,
          name: producer.name,
        },
      }
    : {}),
});
