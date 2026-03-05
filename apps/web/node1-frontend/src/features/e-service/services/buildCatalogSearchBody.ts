import type { bffApi } from "@knodia/bff-client";

import { parseSchemeRefKeys } from "@/features/e-service/utils/schemeRef";

export function buildCatalogSearchBody(params: {
  category: string;
  keywords: string;
  knodeId: string;
}): bffApi.GetConsumerCatalogEserviceSearchParams {
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
