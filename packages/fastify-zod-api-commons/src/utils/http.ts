import type { FastifyReply } from "fastify";

import {
  removePathFromFileName,
  sanitizeFileName,
} from "@knodia/common-models/utils";

const NON_ASCII_PRINTABLE = /[^\x20-\x7e]/g;

export function sendFileDownload({
  content,
  contentType,
  fileName,
  filePrettyName,
  res,
}: {
  content: Buffer | string;
  contentType: string;
  fileName: string;
  filePrettyName?: string;
  res: FastifyReply;
}): void {
  const baseFileName = removePathFromFileName(fileName);
  const extDotIndex = baseFileName.lastIndexOf(".");
  const ext =
    extDotIndex > 0 ? baseFileName.slice(extDotIndex).toLowerCase() : "";

  const prettyNameBase =
    ext && filePrettyName?.toLowerCase().endsWith(ext)
      ? filePrettyName.slice(0, -ext.length)
      : filePrettyName;

  // Use the original fileName as the base for sanitization if filePrettyName is not provided or is empty
  const safeName = sanitizeFileName(
    prettyNameBase ? `${prettyNameBase}${ext}` : fileName,
  );
  const asciiFallback = safeName.replace(NON_ASCII_PRINTABLE, "_");
  res.raw.writeHead(200, {
    "Content-Disposition": `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeRFC5987(safeName)}`,
    "Content-Type": contentType,
  });
  res.raw.end(content);
}

// RFC 5987 reserves a few characters that encodeURIComponent leaves untouched.
function encodeRFC5987(value: string): string {
  return encodeURIComponent(value).replace(
    /['()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}
