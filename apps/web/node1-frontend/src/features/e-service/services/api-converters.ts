import { bffApi } from "@knodia/bff-client";
import { unsafeBrandId } from "@knodia/common-models/ids";

import type { ConsumptionEserviceDetail } from "@/features/e-service/models/consumption-eservice-detail";
import type { ConsumptionEserviceSearchResult } from "@/features/e-service/models/consumption-eservice-search";
import type { EServiceFormData } from "@/features/e-service/types/eserviceCreateForm";

import {
  arrayBufferToBase64,
  getContentType,
} from "@/features/e-service/utils/file";
import { getOrganizationInitials } from "@/utils/getOrganizationInitials";

export function toCatalogSearchResultUI(
  result: bffApi.ConsumerCatalogEserviceSearchResult,
): ConsumptionEserviceSearchResult {
  return {
    categories: result.categories,
    description: result.description.en,
    hasRequiredAttributes: result.hasRequiredAttributes,
    id: unsafeBrandId(result.id),
    mode: result.mode,
    name: result.name.en,
    organization: {
      initials: getOrganizationInitials(result.producer.name),
      name: result.producer.name,
    },
    state: result.latestVersionState,
  };
}

export function toConsumptionEserviceDetail(
  detail: bffApi.ConsumerEserviceDetails,
): ConsumptionEserviceDetail {
  const hasRequiredAttributes =
    detail.requiredAttributes.length === 0 ||
    detail.requiredAttributes.every((group) =>
      group.some((attr) => attr.possessed),
    );

  return {
    accessToken: {
      audience: detail.accessToken.audience,
      durationInMinutes: Math.floor(detail.accessToken.duration / 60),
      type: detail.accessToken.type,
    },
    categories: detail.categories,
    description: detail.description.en,
    // TODO(KN-287): fetch agreement state from BFF (needs BFF to call RRM for active agreements)
    hasActiveAgreement: hasRequiredAttributes,
    hasRequiredAttributes,
    id: unsafeBrandId(detail.id),
    identificationRequired: detail.identificationRequired,
    interfaceDocument: detail.interfaceDocument,
    isSignalHubEnabled: detail.isSignalHubEnabled,
    latestVersionId: unsafeBrandId(detail.latestVersionId),
    maxDailyCalls: detail.maxDailyCalls,
    mode: detail.mode,
    name: detail.name.en,
    producer: {
      email: detail.producer.email,
      initials: getOrganizationInitials(detail.producer.name),
      knodeName: detail.producer.knodeName,
      name: detail.producer.name,
      notes: detail.producer.notes,
    },
    requiredAttributes: detail.requiredAttributes,
    state: detail.state,
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
