const CONTENT_TYPES: Record<string, string> = {
  json: "application/json",
  yaml: "application/yaml",
  yml: "application/yaml",
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
  return CONTENT_TYPES[ext] ?? "application/octet-stream";
}

export const toHex = (value: Uint8Array) =>
  Array.from(value, (byte) =>
    byte
      .toString(16)
      // Ensures each byte is represented as exactly 2 hex characters (e.g. 10 -> "0a", not "a")
      .padStart(2, "0"),
  ).join("");
