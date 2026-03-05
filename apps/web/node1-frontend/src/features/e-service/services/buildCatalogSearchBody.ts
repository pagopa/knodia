import type { bffApi } from "@knodia/bff-client";

import type { ConsumptionEserviceSearchParams } from "@/features/e-service/models/search-params";

import { parseSchemeRefKeys } from "@/features/e-service/utils/schemeRef";

export function buildCatalogSearchBody(
  params: Omit<ConsumptionEserviceSearchParams, "offset">,
): bffApi.GetConsumerCatalogEserviceSearchParams {
  const knodeId = params.knodeId as bffApi.KnodeId;
  const category = params.category
    ? parseSchemeRefKeys([params.category])[0]
    : null;

  if (category && params.keywords) {
    return { category, keywords: params.keywords, knodeId };
  }

  if (category) {
    return { category, knodeId };
  }

  return { keywords: params.keywords, knodeId };
}
