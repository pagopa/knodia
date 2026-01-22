import type { ZodIssue } from "zod-validation-error";

export class ApiError<T> extends Error {
  public errors: { code: T; detail: string }[];
  public status: number;
  public title: string;

  constructor({
    errors,
    status,
    title,
  }: {
    errors: { code: T; detail: string }[];
    status: number;
    title: string;
  }) {
    super(title);
    this.title = title;
    this.errors = errors;
    this.status = status;
  }
}

export function createApiErrorFromDetail<T>({
  code,
  detail,
  status,
  title,
}: {
  code: T;
  detail: string;
  status: number;
  title: string;
}) {
  return new ApiError({
    errors: [{ code, detail }],
    status,
    title,
  });
}

export function createApiErrorFromErrorsList<T>({
  code,
  errors,
  status,
  title,
}: {
  code: T;
  errors: Error[] | ZodIssue[];
  status: number;
  title: string;
}) {
  return new ApiError({
    errors: errors.map((error) => ({ code, detail: error.message })),
    status,
    title,
  });
}
