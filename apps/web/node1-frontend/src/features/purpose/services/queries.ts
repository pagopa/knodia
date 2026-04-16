import type {
  AgreementId,
  EserviceId,
  KnodeId,
  PurposeId,
} from "@knodia/common-models/ids";

import {
  getConsumerPurposeDetailsOptions,
  getConsumerPurposesOptions,
  getProducerPurposeDetailsOptions,
  getProducerPurposesOptions,
} from "@knodia/bff-client/tanstack-query";

import { client } from "@/libs/axios";

const PURPOSES_PAGE_LIMIT = 9;
const PURPOSES_SECTION_LIMIT = 50;

export const consumerPurposeDetailsQuery = (
  purposeId: PurposeId,
  knodeId: KnodeId,
) =>
  getConsumerPurposeDetailsOptions({
    client,
    path: { purposeId },
    query: { knodeId },
  });

export const producerPurposeDetailsQuery = (purposeId: PurposeId) =>
  getProducerPurposeDetailsOptions({ client, path: { purposeId } });

export const consumerPurposesQuery = (offset: number) =>
  getConsumerPurposesOptions({
    client,
    query: { limit: PURPOSES_PAGE_LIMIT, offset },
  });

// TODO: replace hardcoded limit with pagination when the number of purposes per e-service grows
export const consumerPurposesByEserviceQuery = (eserviceId: EserviceId) =>
  getConsumerPurposesOptions({
    client,
    query: { eserviceId, limit: PURPOSES_SECTION_LIMIT, offset: 0 },
  });

export const producerPurposesQuery = (
  offset: number,
  eserviceId?: EserviceId,
) =>
  getProducerPurposesOptions({
    client,
    query: { eserviceId, limit: PURPOSES_PAGE_LIMIT, offset },
  });

// TODO: replace hardcoded limit with pagination when the number of purposes per agreement grows
export const producerPurposesByAgreementQuery = (agreementId: AgreementId) =>
  getProducerPurposesOptions({
    client,
    query: { agreementId, limit: PURPOSES_SECTION_LIMIT, offset: 0 },
  });

// TODO: replace hardcoded limit with pagination when the number of recently updated purposes per e-service grows
export const producerRecentPurposesByEserviceQuery = (eserviceId: EserviceId) =>
  getProducerPurposesOptions({
    client,
    query: {
      eserviceId,
      limit: PURPOSES_SECTION_LIMIT,
      offset: 0,
      recentlyUpdated: true,
    },
  });
