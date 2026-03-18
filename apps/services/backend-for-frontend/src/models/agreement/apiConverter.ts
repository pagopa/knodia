import type { agreementProcessApi } from "@knodia/agreement-process-client";
import type { API_KnodeId } from "@knodia/common-models/internalApi";
import type { eserviceProcessApi } from "@knodia/eservice-process-client";
import type { organizationProcessApi } from "@knodia/organization-process-client";
import type { remoteResourcesManagerApi } from "@knodia/remote-resources-manager-client";

import type {
  API_ProducerAgreement,
  API_ProducerAgreementDetails,
} from "./api.ts";

export const toAPI_ProducerAgreement = ({
  agreement,
  consumer,
  eservice,
}: {
  agreement: agreementProcessApi.Agreement;
  consumer: remoteResourcesManagerApi.Organization;
  eservice: eserviceProcessApi.Eservice;
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
});

export const toAPI_ProducerAgreementDetails = ({
  agreement,
  consumer,
  eservice,
  producer,
}: {
  agreement: agreementProcessApi.Agreement;
  consumer: remoteResourcesManagerApi.Organization;
  eservice: eserviceProcessApi.Eservice;
  producer: organizationProcessApi.Organization & { knodeId: API_KnodeId };
}): API_ProducerAgreementDetails => ({
  ...toAPI_ProducerAgreement({ agreement, consumer, eservice }),
  producer: {
    id: producer.id,
    knodeId: producer.knodeId,
    name: producer.name,
  },
});
