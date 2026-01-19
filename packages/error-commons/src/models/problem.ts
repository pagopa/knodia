import z from "zod";

const ProblemError = z
  .strictObject({
    code: z.string(),
    detail: z.string(),
  })
  .meta({ id: "ProblemError" });

export const Problem = z
  .strictObject({
    correlationId: z.string(),
    detail: z.string(),
    errors: z.array(ProblemError),
    status: z.number().meta({ format: "int32" }),
    title: z.string(),
    type: z.string(),
  })
  .meta({ id: "Problem" });
export type Problem = z.infer<typeof Problem>;
