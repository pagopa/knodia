import { bffApi } from "@knodia/bff-client";

import type { ConsumptionEserviceSearchResult } from "@/features/e-service/models/consumption-eservice-search";
import type { EServiceFormData } from "@/features/e-service/types/eserviceCreateForm";

import {
  arrayBufferToBase64,
  getContentType,
} from "@/features/e-service/utils/file";

export function toCatalogSearchResultUI(
  result: bffApi.CatalogEserviceSearchResult,
): ConsumptionEserviceSearchResult {
  return {
    categories: result.categories,
    description: result.description.en,
    // TODO: use result.hasRequiredAttributes
    hasRequiredAttributes: true,
    id: result.id,
    mode: result.mode,
    name: result.name.en,
    // TODO: resolve producer organization name from producerId (BFF should enrich the response)
    producerId: result.producerId,
    state: result.latestVersionState,
  };
}

export async function toEserviceSeed(
  data: EServiceFormData,
  checksum: string,
): Promise<bffApi.EserviceSeed> {
  const { interfaceDocument } = data;
  const arrayBuffer = await interfaceDocument.arrayBuffer();
  const content = arrayBufferToBase64(arrayBuffer);

  return {
    accessTokenAudience: [data.accessTokenAudience],
    accessTokenDuration: data.accessTokenDuration * 60,
    accessTokenType: data.accessTokenType,
    categories: data.categories,
    description: { en: data.description },
    interfaceDocument: {
      checksum,
      content,
      contentType: getContentType(interfaceDocument),
      name: interfaceDocument.name,
      prettyName: { en: interfaceDocument.name },
    },
    isSignalHubEnabled: data.isSignalHubEnabled,
    maxDailyCallsPerConsumer: data.maxDailyCallsPerConsumer,
    maxDailyCallsPerKnode: data.maxDailyCallsPerKnode,
    mode: data.mode,
    name: { en: data.name },
    requiredAttributes: data.requiredAttributes,
  };
}
