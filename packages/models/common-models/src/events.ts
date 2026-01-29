import z from "zod";

export type EventSchema<
  TEvent extends EventWithDataAndType = EventWithDataAndType,
> = z.ZodType<TEvent>;

interface EventWithDataAndType {
  data: unknown;
  type: string;
}

export const EventEnvelope = <TEventZodType extends EventSchema>(
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
    .and(event)
    .transform(({ data, ...rest }) => {
      if (typeof data !== "string") {
        throw new Error("Expected data to be a hex string");
      }

      return event.parse({
        ...rest,
        data: Uint8Array.from(Buffer.from(data, "hex")),
      });
    });
export type EventEnvelope<TEventZodType extends EventSchema> = z.infer<
  ReturnType<typeof EventEnvelope<TEventZodType>>
>;

const KafkaMessageValue = <TEventZodType extends EventSchema>(
  event: TEventZodType,
) =>
  z
    .object({
      after: z.nonoptional(z.unknown()),
    })
    .transform(({ after }) => after)
    .pipe(EventEnvelope(event));

export const KafkaMessageEnvelope = <TEventZodType extends EventSchema>(
  event: TEventZodType,
) =>
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

export type KafkaMessageEnvelope<TEventZodType extends EventSchema> = z.infer<
  ReturnType<typeof KafkaMessageEnvelope<TEventZodType>>
>;
