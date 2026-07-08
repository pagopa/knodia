import type { AxiosHeaderValue } from "axios";

import { parseContentDispositionFileName } from "@knodia/fastify-zod-api-commons/http";

export const downloadFile = (file: File | null | undefined) => {
  if (!file) return;

  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  link.click();
  URL.revokeObjectURL(url);
};

export const downloadResponseAsFile = ({
  contentDisposition,
  contentType,
  data,
  fileName,
}: {
  contentDisposition?: AxiosHeaderValue | undefined;
  contentType: AxiosHeaderValue | undefined;
  data: unknown;
  fileName?: string;
}) => {
  const content =
    typeof data === "string" ? data : JSON.stringify(data, null, 2);

  const downloadFileName =
    fileName ??
    parseContentDispositionFileName(
      typeof contentDisposition === "string" ? contentDisposition : undefined,
    );
  const file = new File([content], downloadFileName, {
    type: typeof contentType === "string" ? contentType : "",
  });
  downloadFile(file);
};
