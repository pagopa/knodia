import type { ValidationError } from "@tanstack/react-form";

interface Options {
  /** Custom fallback message for number fields with invalid input (e.g., NaN) */
  numberFallback?: string;
}

/**
 * Extracts and joins error messages from TanStack Form field errors.
 * Handles number field edge cases where Zod returns generic "Invalid input" or "Received NaN" messages.
 */
export function getFieldErrorMessage(
  errors: ValidationError[],
  options?: Options,
): string {
  const { numberFallback } = options ?? {};

  return errors
    .filter(hasMessage)
    .map((error) => {
      if (numberFallback && /nvalid|input/i.test(error.message)) {
        return numberFallback;
      }

      return error.message;
    })
    .join(", ");
}

function hasMessage(error: unknown): error is { message: string } {
  return !!error && typeof error === "object" && "message" in error;
}
