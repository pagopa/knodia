import { z } from "zod";

export const NonEmptyArray = <T extends z.ZodTypeAny>(item: T) =>
  z.tuple([item], item);
export type NonEmptyArray<T> = [T, ...T[]];

export const CommaSeparatedList = <T extends z.core.SomeType>(item: T) =>
  z
    .string()
    .trim()
    .transform(
      (str) =>
        str
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean) as unknown,
    )
    .pipe(z.array(item));
export type CommaSeparatedList<T> = T[];
