import type { KnodeId } from "@knodia/common-models/ids";

import { bffApi } from "@knodia/bff-client";
import { toastQueue } from "@knodia/ui-kit/ui";
import { match } from "ts-pattern";

import { client } from "@/libs/axios";
import { downloadResponseAsFile } from "@/utils/downloadFile";

export async function downloadTemplateInterface(
  templateId: string,
  knodeId: KnodeId,
) {
  try {
    const response = await bffApi.downloadEserviceTemplateInterface({
      client,
      path: { eserviceTemplateId: templateId },
      query: { knodeId },
    });

    downloadResponseAsFile({
      contentDisposition: response.headers["content-disposition"],
      contentType: response.headers["content-type"],
      data: response.data,
    });
  } catch {
    toastQueue.add({
      description: "Retry later",
      kind: "error",
      title: "Download failed",
    });
  }
}

export function getEserviceModeLabel(mode: bffApi.EserviceMode) {
  return match(mode)
    .with("ProvideData", () => "Provide data")
    .with("ReceiveData", () => "Receive data")
    .exhaustive();
}
