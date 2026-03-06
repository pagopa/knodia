import type { agreementProcessApi } from "@knodia/agreement-process-client";
import type { eserviceProcessApi } from "@knodia/eservice-process-client";
import type { Organization } from "@knodia/organization-models";

import type { API_ProducerAgreement } from "./api.ts";

export const toAPI_ProducerAgreement = ({
  agreement,
  consumer,
  eservice,
}: {
  agreement: agreementProcessApi.Agreement;
  consumer: Organization; // TODO: update with organizationProcessApi.Organization when available
  eservice: eserviceProcessApi.Eservice;
}): API_ProducerAgreement => ({
  consumer: {
    id: consumer.id,
    name: { en: consumer.name }, // TODO: localized or not?
  },
  eservice: {
    id: eservice.id,
    name: eservice.name,
  },
  id: agreement.id,
  state: agreement.state,
});
