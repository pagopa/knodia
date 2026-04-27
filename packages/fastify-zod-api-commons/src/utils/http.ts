import type { FastifyReply } from "fastify";

export function parseContentDispositionFileName(
  contentDisposition: string | undefined,
): string {
  const match = contentDisposition?.match(/filename="(.+?)"/);
  return match?.[1] ?? "document";
}

export function sendFileDownload(
  res: FastifyReply,
  content: Buffer | string,
  fileName: string,
  contentType: string,
): void {
  res.raw.writeHead(200, {
    "Content-Disposition": `attachment; filename="${fileName}"`,
    "Content-Type": contentType,
  });
  res.raw.end(content);
}
