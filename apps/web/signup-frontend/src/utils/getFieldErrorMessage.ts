import type { ValidationError } from "@tanstack/react-form";

/** Extracts and joins the messages from TanStack Form field errors. */
export function getFieldErrorMessage(errors: ValidationError[]): string {
  return errors
    .filter(hasMessage)
    .map((error) => error.message)
    .join(", ");
}

function hasMessage(error: unknown): error is { message: string } {
  return !!error && typeof error === "object" && "message" in error;
}
