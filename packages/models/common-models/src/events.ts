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

const KafkaMessageValue = <TEventZodType extends z.ZodType>(
  event: TEventZodType,
) =>
  z
    .object({
      after: z.nonoptional(z.unknown()),
    })
    .transform((v) => EventEnvelope(event).parse(v.after));

export const KafkaMessageEnvelope = <TEvent extends z.ZodType>(event: TEvent) =>
  z
    .object({
      value: z.nonoptional(z.unknown()),
    })
    .transform((v) => {
      const json = JSON.parse(String(v.value));
      return {
        ...json,
        after: {
          ...json.after,
          data: Uint8Array.from(Buffer.from(json.after.data, "hex")),
        },
      };
    })
    .pipe(KafkaMessageValue(event));

export type KafkaMessageEnvelope<TEvent> = z.infer<
  ReturnType<typeof KafkaMessageEnvelope<z.ZodType<TEvent>>>
>;
