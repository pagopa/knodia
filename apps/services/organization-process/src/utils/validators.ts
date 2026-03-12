import type { ReadmodelService } from "../services/readmodelService.ts";

import { duplicateOrganizationName } from "../models/errors.ts";

export async function assertOrganizationNameIsUnique(
  name: string,
  readmodelService: ReadmodelService,
): Promise<void> {
  const existing = await readmodelService.getOrganizationByName(name);
  if (existing !== undefined) {
    throw duplicateOrganizationName(name);
  }
}
