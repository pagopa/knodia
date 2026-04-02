import type { agreementProcessApi } from "@knodia/agreement-process-client";
import type { eserviceProcessApi } from "@knodia/eservice-process-client";
import type { remoteResourcesManagerApi } from "@knodia/remote-resources-manager-client";

import type { OrganizationWithKnode } from "../organization/types.ts";
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
  latestEserviceVersionState,
  producer,
}: {
  agreement: agreementProcessApi.Agreement;
  consumer: remoteResourcesManagerApi.Organization;
  eservice: eserviceProcessApi.Eservice;
  latestEserviceVersionState: eserviceProcessApi.EserviceVersionState;
  producer: OrganizationWithKnode;
}): API_ProducerAgreementDetails => ({
  ...toAPI_ProducerAgreement({ agreement, consumer, eservice }),
  latestEserviceVersionState,
  producer: {
    id: producer.id,
    knodeId: producer.knodeId,
    name: producer.name,
  },
});
