import type { bffApi } from "@knodia/bff-client";

const CATEGORY_SEPARATOR = "$";

export function buildCatalogSearchBody(params: {
  category: string;
  keywords: string;
  knode: string;
}): bffApi.GetCatalogEserviceSearchParams | null {
  const knodeId = params.knode as bffApi.KnodeId;
  const category = params.category ? parseCategory(params.category) : null;
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

function parseCategory(compositeKey: string): bffApi.EserviceCategory | null {
  const [scheme, code] = compositeKey.split(CATEGORY_SEPARATOR);
  if (!scheme || !code) return null;
  return { code, scheme };
}
