import z from "zod";

export const NonEmptyArray = <T extends z.ZodTypeAny>(item: T) =>
  z.tuple([item], item);
export type NonEmptyArray<T> = [T, ...T[]];

export const CommaSeparatedArray = <T extends z.ZodTypeAny>(item: T) =>
  z.string().transform((str) =>
    str
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((itemStr) => item.parse(itemStr)),
  );
export type CommaSeparatedArray<T> = T[];
