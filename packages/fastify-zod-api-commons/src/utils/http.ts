export function parseContentDispositionFileName(
  contentDisposition: string | undefined,
): string {
  const match = contentDisposition?.match(/filename="(.+?)"/);
  return match?.[1] ?? "document";
}
