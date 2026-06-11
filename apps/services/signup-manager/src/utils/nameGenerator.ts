import { randomInt } from "node:crypto";

import { STAR_NAMES } from "./starNames.ts";
type GeneratedOrganizationName = `${(typeof STAR_NAMES)[number]} ${string} Org`;

export function generateRandomOrgName(): GeneratedOrganizationName {
  return `${randomPick(STAR_NAMES)} ${randomAlphaNumeric3()} Org`;
}

export function toUserName(orgName: GeneratedOrganizationName): string {
  return (
    orgName
      .toLowerCase()
      .replace(/org$/, "") // Remove "Org" suffix
      .replace(/[^a-z0-9]+/g, "_") // Replace non-alphanumeric characters with underscores
      .replace(/(^_|_$)+/g, "") + `_user` // Add "_user" suffix
  );
}

function randomAlphaNumeric3(): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  return Array.from(
    { length: 3 },
    () => alphabet[randomInt(alphabet.length)],
  ).join("");
}

function randomPick<T>(items: readonly [T, ...T[]]): T {
  return items[randomInt(items.length)] as T;
}
