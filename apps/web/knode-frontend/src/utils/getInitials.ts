export function getInitials(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length === 0) return "";

  const words = trimmed.split(/\s+/).filter(Boolean);

  if (words.length >= 2) {
    const firstWord = words.at(0) ?? "";
    const lastWord = words.at(-1) ?? "";
    const first = Array.from(firstWord)[0] ?? "";
    const last = Array.from(lastWord)[0] ?? "";
    return (first + last).toUpperCase();
  }

  return (Array.from(trimmed)[0] ?? "").toUpperCase();
}
