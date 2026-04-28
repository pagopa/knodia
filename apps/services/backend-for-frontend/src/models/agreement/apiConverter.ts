import type { agreementProcessApi } from "@knodia/agreement-process-client";
import type { eserviceProcessApi } from "@knodia/eservice-process-client";
import type { remoteResourcesManagerApi } from "@knodia/remote-resources-manager-client";

import type { OrganizationWithKnode } from "../organization/types.ts";
import type {
  API_ConsumerAgreement,
  API_ProducerAgreement,
  API_ProducerAgreementDetails,
} from "./api.ts";

import { hasRecentlyBeenUpdated } from "../../utils/recentUpdate.ts";

export const toAPI_ConsumerAgreement = (
  agreement: remoteResourcesManagerApi.Agreement,
): API_ConsumerAgreement => ({
  consumer: agreement.consumer,
  eserviceId: agreement.eserviceId,
  eserviceVersionId: agreement.eserviceVersionId,
  id: agreement.id,
  producerId: agreement.producerId,
  state: agreement.state,
  suspendedByConsumerAt: agreement.suspendedByConsumerAt,
  suspendedByProducerAt: agreement.suspendedByProducerAt,
  updatedAt: agreement.updatedAt,
});

export const toAPI_ProducerAgreement = ({
  agreement,
  consumer,
  eservice,
  recentUpdateDays,
}: {
  agreement: agreementProcessApi.Agreement;
  consumer: remoteResourcesManagerApi.Organization;
  eservice: eserviceProcessApi.Eservice;
  recentUpdateDays: number;
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
  hasRecentlyBeenUpdated: hasRecentlyBeenUpdated(agreement, recentUpdateDays),
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
  latestEserviceVersionState,
  producer: {
    id: producer.id,
    knodeId: producer.knodeId,
    name: producer.name,
  },
  state: agreement.state,
  suspendedByConsumerAt: agreement.suspendedByConsumerAt,
  suspendedByProducerAt: agreement.suspendedByProducerAt,
});
