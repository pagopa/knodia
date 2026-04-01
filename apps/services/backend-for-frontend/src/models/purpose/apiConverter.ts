import type { agreementProcessApi } from "@knodia/agreement-process-client";
import type { API_KnodeId } from "@knodia/common-models/internalApi";
import type { eserviceProcessApi } from "@knodia/eservice-process-client";
import type { organizationProcessApi } from "@knodia/organization-process-client";
import type { purposeProcessApi } from "@knodia/purpose-process-client";
import type { remoteResourcesManagerApi } from "@knodia/remote-resources-manager-client";

import type {
  API_ConsumerPurposeDetails,
  API_ProducerPurpose,
  API_ProducerPurposeDetails,
} from "./api.ts";

export const toAPI_ProducerPurpose = ({
  consumer,
  eservice,
  purpose,
}: {
  consumer: remoteResourcesManagerApi.Organization;
  eservice: eserviceProcessApi.Eservice;
  purpose: purposeProcessApi.Purpose;
}): API_ProducerPurpose => ({
  consumer: {
    id: consumer.id,
    knodeId: purpose.consumer.knodeId,
    name: consumer.name,
  },
  dailyCalls: purpose.dailyCalls,
  description: purpose.description,
  eservice: {
    id: eservice.id,
    name: eservice.name,
  },
  id: purpose.id,
  name: purpose.name,
  state: purpose.state,
});

export const toAPI_ConsumerPurposeDetails = ({
  agreement,
  consumer,
  eserviceDetails,
  purpose,
}: {
  agreement: remoteResourcesManagerApi.EserviceAgreementDetail;
  consumer: organizationProcessApi.Organization & { knodeId: API_KnodeId };
  eserviceDetails: remoteResourcesManagerApi.EserviceDetails;
  purpose: remoteResourcesManagerApi.Purpose;
}): API_ConsumerPurposeDetails => ({
  agreement: {
    id: agreement.id,
    state: agreement.state,
  },
  consumer: {
    id: consumer.id,
    knodeId: consumer.knodeId,
    name: consumer.name,
  },
  dailyCalls: purpose.dailyCalls,
  description: purpose.description,
  eservice: {
    id: eserviceDetails.id,
    latestVersionState: eserviceDetails.latestVersion.state,
    name: eserviceDetails.name,
  },
  id: purpose.id,
  maxDailyCallsPerConsumer:
    eserviceDetails.latestVersion.maxDailyCallsPerConsumer,
  name: purpose.name,
  producer: {
    id: eserviceDetails.producer.id,
    knodeId: eserviceDetails.producer.knodeId,
    name: eserviceDetails.producer.name,
  },
  state: purpose.state,
});

export const toAPI_ProducerPurposeDetails = ({
  agreement,
  consumer,
  eservice,
  latestEserviceVersionState,
  maxDailyCallsPerConsumer,
  producer,
  purpose,
}: {
  agreement: agreementProcessApi.Agreement;
  consumer: remoteResourcesManagerApi.Organization;
  eservice: eserviceProcessApi.Eservice;
  latestEserviceVersionState: eserviceProcessApi.EserviceVersionState;
  maxDailyCallsPerConsumer: number;
  producer: organizationProcessApi.Organization & { knodeId: API_KnodeId };
  purpose: purposeProcessApi.Purpose;
}): API_ProducerPurposeDetails => ({
  agreement: {
    id: agreement.id,
    state: agreement.state,
  },
  consumer: {
    id: consumer.id,
    knodeId: purpose.consumer.knodeId,
    name: consumer.name,
  },
  dailyCalls: purpose.dailyCalls,
  description: purpose.description,
  eservice: {
    id: eservice.id,
    latestVersionState: latestEserviceVersionState,
    name: eservice.name,
  },
  id: purpose.id,
  maxDailyCallsPerConsumer,
  name: purpose.name,
  producer: {
    id: producer.id,
    knodeId: producer.knodeId,
    name: producer.name,
  },
  state: purpose.state,
});
