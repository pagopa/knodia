export class ApiError<T> extends Error {
  public code: T;
  public detail: string;
  public errors: { code: T; detail: string }[];
  public title: string;

  constructor({
    code,
    detail,
    errors,
    title,
  }: {
    code: T;
    detail: string;
    errors?: Error[];
    title: string;
  }) {
    super(detail);
    this.code = code;
    this.title = title;
    this.detail = detail;
    this.errors =
      errors && errors.length > 0
        ? errors.map((e) => ({ code, detail: e.message }))
        : [{ code, detail }];
  }
}

export function createApiError<T>(code: T, detail: string, title: string) {
  return new ApiError({
    code,
    detail,
    title,
  });
}
