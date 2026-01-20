export class ApiError<T> extends Error {
  public code: T;
  public detail: string;
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
    errors?: Error[];
    status: number;
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
    code,
    detail,
    status,
    title,
  });
}
