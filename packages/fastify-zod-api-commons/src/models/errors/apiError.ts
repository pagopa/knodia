import { fromZodIssue, type ZodIssue } from "zod-validation-error";

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

export function createApiError<T>({
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
  errors: ApiError<T>[] | Error[] | ZodIssue[];
  status: number;
  title: string;
}) {
  const normalizedErrors: { code: T; detail: string }[] = [];
  for (const e of errors) {
    if (e instanceof ApiError) {
      normalizedErrors.push(...e.errors);
    } else if (e instanceof Error) {
      normalizedErrors.push({ code, detail: e.message });
    } else {
      normalizedErrors.push({ code, detail: fromZodIssue(e).message });
    }
  }
  return new ApiError({
    errors: normalizedErrors,
    status,
    title,
  });
}
