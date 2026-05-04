import type { AgreementId, EserviceId } from "@knodia/common-models/ids";

import {
  getPendingConsumerAgreementsOptions,
  getProducerAgreementDetailsOptions,
  getProducerAgreementsOptions,
} from "@knodia/bff-client/tanstack-query";

import { client } from "@/libs/axios";

const AGREEMENTS_PAGE_LIMIT = 9;
const AGREEMENTS_SECTION_LIMIT = 50;

export const producerAgreementDetailsQuery = (agreementId: AgreementId) =>
  getProducerAgreementDetailsOptions({
    client,
    path: { agreementId },
  });

export const pendingConsumerAgreementsQuery = (offset: number) =>
  getPendingConsumerAgreementsOptions({
    client,
    query: { limit: AGREEMENTS_PAGE_LIMIT, offset },
  });

export const producerAgreementsQuery = (
  offset: number,
  eserviceId?: EserviceId,
) =>
  getProducerAgreementsOptions({
    client,
    query: { eserviceId, limit: AGREEMENTS_PAGE_LIMIT, offset },
  });

// TODO: replace hardcoded limit with pagination when the number of recently updated agreements per e-service grows
export const producerRecentAgreementsByEserviceQuery = (
  eserviceId: EserviceId,
) =>
  getProducerAgreementsOptions({
    client,
    query: {
      eserviceId,
      limit: AGREEMENTS_SECTION_LIMIT,
      offset: 0,
      recentlyUpdated: "true",
    },
  });
