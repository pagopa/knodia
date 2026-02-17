export const FILE_CONTENT_TYPES: Record<string, string> = {
  json: "application/json",
  yaml: "application/x-yaml",
  yml: "application/x-yaml",
};

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join(
    "",
  );
  return btoa(binary);
}

export function getContentType(file: File): string {
  if (file.type) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return FILE_CONTENT_TYPES[ext] ?? "application/octet-stream";
}
