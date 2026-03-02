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
  const keywords = params.keywords || null;

  if (category && keywords) {
    return { category, keywords, knodeId };
  }

  if (category) {
    return { category, knodeId };
  }

  if (keywords) {
    return { keywords, knodeId };
  }

  throw new Error("At least one of category or keywords is required");
}
