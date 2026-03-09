export function getOrganizationInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";

  return words
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
