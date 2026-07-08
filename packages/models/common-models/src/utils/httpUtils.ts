const FALLBACK_FILE_NAME = "document";

// eslint-disable-next-line no-control-regex -- intentionally matching control chars to strip them
const CONTROL_AND_QUOTE = /[\x00-\x1f\x7f"]/g;

export function parseContentDispositionFileName(
  contentDisposition: string | undefined,
): string {
  if (!contentDisposition) {
    return FALLBACK_FILE_NAME;
  }
  // The RFC 5987 extended form carries the original (possibly non-ASCII) name.
  const extended = contentDisposition.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
  if (extended?.[1]) {
    try {
      return sanitizeFileName(decodeURIComponent(extended[1]));
    } catch {
      // Malformed percent-encoding: fall back to the plain filename parameter.
    }
  }
  const quoted = contentDisposition.match(/filename\s*=\s*"([^"]*)"/i);
  if (quoted?.[1]) {
    return sanitizeFileName(quoted[1]);
  }
  const token = contentDisposition.match(/filename\s*=\s*([^;]+)/i);
  return token?.[1] ? sanitizeFileName(token[1].trim()) : FALLBACK_FILE_NAME;
}

/**
 * Strips any path component and header-breaking characters from a user-provided
 * file name, so it can safely be used in an S3 key or a Content-Disposition header.
 */
export function sanitizeFileName(fileName: string): string {
  const baseName = fileName.split(/[/\\]/).pop() ?? "";
  // Prevent Content-Disposition header injection.
  const cleaned = baseName.replace(CONTROL_AND_QUOTE, "").trim();
  return cleaned === "" || /^\.+$/.test(cleaned) ? FALLBACK_FILE_NAME : cleaned;
}
