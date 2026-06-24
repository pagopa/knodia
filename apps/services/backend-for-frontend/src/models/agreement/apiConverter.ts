import type { agreementProcessApi } from "@knodia/agreement-process-client";
import type { eserviceProcessApi } from "@knodia/eservice-process-client";
import type { remoteResourcesManagerApi } from "@knodia/remote-resources-manager-client";

import type { OrganizationWithKnode } from "../organization/types.ts";
import type {
  API_ConsumerAgreement,
  API_PendingConsumerAgreement,
  API_ProducerAgreement,
  API_ProducerAgreementDetails,
} from "./api.ts";

import { hasRecentlyBeenUpdated } from "../../utils/recentUpdate.ts";

export const toAPI_ConsumerAgreement = ({
  agreement,
  eservice,
}: {
  agreement: remoteResourcesManagerApi.Agreement;
  eservice: remoteResourcesManagerApi.EserviceDetails;
}): API_ConsumerAgreement => ({
  eservice: {
    id: eservice.id,
    name: eservice.name,
  },
  id: agreement.id,
  knodeId: eservice.knodeId,
  producer: {
    id: eservice.producer.id,
    name: eservice.producer.name,
  },
  state: agreement.state,
  updatedAt: agreement.updatedAt,
});

export const toAPI_PendingConsumerAgreement = ({
  eservice,
  recentUpdateDays,
}: {
  eservice: remoteResourcesManagerApi.Eservice;
  recentUpdateDays: number;
}): API_PendingConsumerAgreement => ({
  eservice: {
    categories: eservice.categories,
    id: eservice.id,
    mode: eservice.mode,
    name: eservice.name,
    state: eservice.version.state,
  },
  hasRecentlyBeenUpdated:
    hasRecentlyBeenUpdated(eservice, recentUpdateDays) ||
    hasRecentlyBeenUpdated(eservice.agreement, recentUpdateDays),
  id: eservice.agreement.id,
  knodeId: eservice.knodeId,
  producer: eservice.producer,
});

export const toAPI_ProducerAgreement = ({
  agreement,
  consumer,
  eservice,
  recentUpdateDays,
}: {
  agreement: agreementProcessApi.Agreement;
  consumer: remoteResourcesManagerApi.Organization;
  eservice: eserviceProcessApi.FlatEservice;
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
  updatedAt: agreement.updatedAt,
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
  eservice: eserviceProcessApi.FlatEservice;
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
  knodeId: producer.knodeId,
  latestEserviceVersionState,
  producer: {
    id: producer.id,
    name: producer.name,
  },
  state: agreement.state,
  suspendedByConsumerAt: agreement.suspendedByConsumerAt,
  suspendedByProducerAt: agreement.suspendedByProducerAt,
  updatedAt: agreement.updatedAt,
});
