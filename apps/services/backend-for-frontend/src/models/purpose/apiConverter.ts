import type { agreementProcessApi } from "@knodia/agreement-process-client";
import type { API_KnodeId } from "@knodia/common-models/internalApi";
import type { eserviceProcessApi } from "@knodia/eservice-process-client";
import type { organizationProcessApi } from "@knodia/organization-process-client";
import type { purposeProcessApi } from "@knodia/purpose-process-client";
import type { remoteResourcesManagerApi } from "@knodia/remote-resources-manager-client";

import type { API_ProducerPurposeDetails } from "./api.ts";

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
