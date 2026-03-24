import type { AgreementId } from "@knodia/common-models/ids";

import {
  getProducerAgreementDetailsOptions,
  getProducerAgreementsOptions,
} from "@knodia/bff-client/tanstack-query";

import { client } from "@/libs/axios";

const AGREEMENTS_PAGE_LIMIT = 9;

export const producerAgreementDetailsQuery = (agreementId: AgreementId) =>
  getProducerAgreementDetailsOptions({
    client,
    path: { agreementId },
  });

export const producerAgreementsQuery = (offset: number) =>
  getProducerAgreementsOptions({
    client,
    query: { limit: AGREEMENTS_PAGE_LIMIT, offset },
  });
