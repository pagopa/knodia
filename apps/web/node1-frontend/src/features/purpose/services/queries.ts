import type {
  AgreementId,
  EserviceId,
  KnodeId,
  PurposeId,
} from "@knodia/common-models/ids";

import {
  getConsumerKeychainsOptions,
  getConsumerKeychainsQueryKey,
  getConsumerPurposeDetailsOptions,
  getConsumerPurposesOptions,
  getProducerPurposeDetailsOptions,
  getProducerPurposesOptions,
} from "@knodia/bff-client/tanstack-query";

import { client } from "@/libs/axios";

const PURPOSES_PAGE_LIMIT = 9;
const PURPOSES_SECTION_LIMIT = 50;
const PURPOSES_LINKED_KEYCHAINS_LIMIT = 10;

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

export const producerPurposesQuery = (offset: number) =>
  getProducerPurposesOptions({
    client,
    query: { limit: PURPOSES_PAGE_LIMIT, offset },
  });

// TODO: replace hardcoded limit with pagination when the number of purposes per agreement grows
export const producerPurposesByAgreementQuery = (agreementId: AgreementId) =>
  getProducerPurposesOptions({
    client,
    query: { agreementId, limit: PURPOSES_SECTION_LIMIT, offset: 0 },
  });

export const purposeLinkedConsumerKeychainsQuery = (
  purposeId: string,
  knodeId: KnodeId,
  offset: number,
) =>
  getConsumerKeychainsOptions({
    client,
    query: {
      limit: PURPOSES_LINKED_KEYCHAINS_LIMIT,
      offset,
      purpose: `${knodeId}:${purposeId}`,
    },
  });

export const purposeLinkedConsumerKeychainsQueryKey = (
  purposeId: string,
  knodeId: KnodeId,
) =>
  getConsumerKeychainsQueryKey({
    client,
    query: {
      limit: PURPOSES_LINKED_KEYCHAINS_LIMIT,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      offset: undefined!,
      purpose: `${knodeId}:${purposeId}`,
    },
  });
