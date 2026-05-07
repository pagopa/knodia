import type { bffApi } from "@knodia/bff-client";
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
  getConsumerPurposesQueryKey,
  getProducerPurposeDetailsOptions,
  getProducerPurposesOptions,
} from "@knodia/bff-client/tanstack-query";

import { client } from "@/libs/axios";

const PURPOSES_PAGE_LIMIT = 9;
const PURPOSES_SECTION_LIMIT = 50;
const PURPOSES_LINKED_KEYCHAINS_LIMIT = 10;
const NON_ARCHIVED_STATES: bffApi.PurposeState[] = ["Active", "Suspended"];

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
    query: {
      limit: PURPOSES_PAGE_LIMIT,
      offset,
      state: NON_ARCHIVED_STATES,
    },
  });

export const consumerArchivedPurposesQuery = (offset: number) =>
  getConsumerPurposesOptions({
    client,
    query: {
      limit: PURPOSES_PAGE_LIMIT,
      offset,
      state: ["Archived"],
    },
  });

// TODO: replace hardcoded limit with pagination when the number of purposes per e-service grows
export const consumerPurposesByEserviceQuery = (eserviceId: EserviceId) =>
  getConsumerPurposesOptions({
    client,
    query: {
      eserviceId,
      limit: PURPOSES_SECTION_LIMIT,
      offset: 0,
      state: NON_ARCHIVED_STATES,
    },
  });

export const producerPurposesQuery = (
  offset: number,
  eserviceId?: EserviceId,
) =>
  getProducerPurposesOptions({
    client,
    query: {
      eserviceId,
      limit: PURPOSES_PAGE_LIMIT,
      offset,
      state: NON_ARCHIVED_STATES,
    },
  });

export const producerArchivedPurposesQuery = (offset: number) =>
  getProducerPurposesOptions({
    client,
    query: {
      limit: PURPOSES_PAGE_LIMIT,
      offset,
      state: ["Archived"],
    },
  });

// TODO: replace hardcoded limit with pagination when the number of purposes per agreement grows
export const producerPurposesByAgreementQuery = (agreementId: AgreementId) =>
  getProducerPurposesOptions({
    client,
    query: {
      agreementId,
      limit: PURPOSES_SECTION_LIMIT,
      offset: 0,
      state: NON_ARCHIVED_STATES,
    },
  });

// TODO: replace hardcoded limit with pagination when the number of recently updated purposes per e-service grows
export const producerRecentPurposesByEserviceQuery = (eserviceId: EserviceId) =>
  getProducerPurposesOptions({
    client,
    query: {
      eserviceId,
      limit: PURPOSES_SECTION_LIMIT,
      offset: 0,
      recentlyUpdated: "true",
      state: NON_ARCHIVED_STATES,
    },
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

export const consumerPurposesQueryKey = () =>
  getConsumerPurposesQueryKey({
    client,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    query: undefined!,
  });

export const purposeLinkedConsumerKeychainsQueryKey = () =>
  getConsumerKeychainsQueryKey({
    client,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    query: undefined!,
  });
