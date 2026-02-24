import z from "zod";

export const NonEmptyArray = <T extends z.ZodTypeAny>(item: T) =>
  z.tuple([item], item);
export type NonEmptyArray<T> = [T, ...T[]];
