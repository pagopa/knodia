import { is404AxiosError } from "@knodia/polling";

/**
 * Checks if a resource exists by calling the provided function.
 * @returns true if the resource exists, false if not found (404), throws for other errors
 */
export const resourceExists = async (
  check: () => Promise<unknown>,
): Promise<boolean> => {
  try {
    await check();
    return true;
  } catch (error) {
    if (is404AxiosError(error)) {
      return false;
    }
    throw error;
  }
};
