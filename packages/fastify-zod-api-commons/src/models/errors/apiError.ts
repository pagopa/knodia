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
  const normalizedErrors = errors.flatMap((e) => {
    if (e instanceof ApiError) {
      return e.errors.map((err) => ({ code: err.code, detail: err.detail }));
    } else if (e instanceof Error) {
      return { code, detail: e.message };
    } else {
      return { code, detail: fromZodIssue(e).message };
    }
  });

  return new ApiError({
    errors: normalizedErrors,
    status,
    title,
  });
}
