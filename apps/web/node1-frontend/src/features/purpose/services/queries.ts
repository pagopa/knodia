import type { PurposeId } from "@knodia/common-models/ids";

import { getProducerPurposeDetailsOptions } from "@knodia/bff-client/tanstack-query";

import { client } from "@/libs/axios";

export const producerPurposeDetailsQuery = (purposeId: PurposeId) =>
  getProducerPurposeDetailsOptions({ client, path: { purposeId } });
