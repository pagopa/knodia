import type { bffApi } from "@knodia/bff-client";

import { parseSchemeRefKeys } from "@/features/e-service/utils/schemeRef";

export function buildCatalogSearchBody(params: {
  category: string;
  keywords: string;
  knode: string;
}): bffApi.GetConsumerCatalogEserviceSearchParams | null {
  const knodeId = params.knode as bffApi.KnodeId;
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

  return null;
}
