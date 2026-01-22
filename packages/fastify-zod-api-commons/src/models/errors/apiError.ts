import type { ZodIssue } from "zod-validation-error";

export class ApiError<T> extends Error {
  public code: T;
  public errors: { detail: string }[];
  public status: number;
  public title: string;

  constructor({
    code,
    errors,
    status,
    title,
  }: {
    code: T;
    errors: { detail: string }[];
    status: number;
    title: string;
  }) {
    super(title);
    this.title = title;
    this.errors = errors;
    this.code = code;
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
    code,
    errors: [{ detail }],
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
    code,
    errors: errors.map((error) => ({ detail: error.message })),
    status,
    title,
  });
}
