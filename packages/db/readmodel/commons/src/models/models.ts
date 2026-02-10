export interface WithMetadata<T> {
  data: T;
  metadata: { version: number };
}
