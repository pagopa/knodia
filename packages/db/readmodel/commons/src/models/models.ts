export interface ListResult<T> {
  results: T[];
  totalCount: number;
}

export interface WithMetadata<T> {
  data: T;
  metadata: { version: number };
}
