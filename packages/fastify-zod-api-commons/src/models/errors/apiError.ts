import type { ZodIssue } from "zod-validation-error";

export class ApiError<T> extends Error {
  public code: T;
  public errors: { code: T; detail: string }[];
  public status: number;
  public title: string;

  constructor({
    code,
    detail,
    errors,
    status,
    title,
  }: {
    code: T;
    detail: string;
    errors?: Error[] | ZodIssue[];
    status: number;
    title: string;
  }) {
    super(detail);
    this.code = code;
    this.title = title;
    this.errors =
      errors && errors.length > 0
        ? errors.map((e) => ({ code, detail: e.message }))
        : [{ code, detail }];
    this.status = status;
  }
}

export function createApiError<T>({
  code,
  detail,
  errors,
  status,
  title,
}: {
  code: T;
  detail: string;
  errors?: Error[] | ZodIssue[];
  status: number;
  title: string;
}) {
  return new ApiError({
    code,
    detail,
    errors,
    status,
    title,
  });
}
