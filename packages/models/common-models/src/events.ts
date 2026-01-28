import z from "zod";

export const EventEnvelope = <TEventZodType extends z.ZodType>(
  event: TEventZodType,
) =>
  z
    .object({
      correlation_id: z.string(),
      log_date: z.coerce.date(),
      sequence_num: z.number(),
      stream_id: z.uuid(),
      version: z.number(),
    })
    .and(event);
export type EventEnvelope<TEvent> = z.infer<
  ReturnType<typeof EventEnvelope<z.ZodType<TEvent>>>
>;
