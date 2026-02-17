import z from "zod";

export interface ListResult<T> {
  results: T[];
  totalCount: number;
}

export interface WithMetadata<T> {
  data: T;
  metadata: { version: number };
}

export const SortDirection = z.enum(["asc", "desc"]);
export type SortDirection = z.infer<typeof SortDirection>;
