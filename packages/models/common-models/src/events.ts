import z from "zod";

export const EventEnvelope = <TEventZodType extends z.ZodType>(
  event: TEventZodType,
) =>
  z.intersection(
    z.object({
      correlation_id: z.string().nullish(),
      log_date: z.coerce.date(),
      sequence_num: z.number(),
      stream_id: z.uuid(),
      version: z.number(),
    }),
    event,
  );
export type EventEnvelope<TEvent> = z.infer<
  ReturnType<typeof EventEnvelope<z.ZodType<TEvent>>>
>;

type EventEnvelopeOutput<TEventZodType extends z.ZodType> = z.output<
  ReturnType<typeof EventEnvelope<TEventZodType>>
>;

export const kafkaMessageEnvelope = <TEvent extends z.ZodType>(event: TEvent) =>
  z
    .object({
      value: z.preprocess(
        (value) => JSON.parse(value?.toString() ?? ""),
        z.object({
          after: EventEnvelope(event) as z.ZodType<EventEnvelopeOutput<TEvent>>,
        }),
      ),
    })
    .transform((v) => v.value.after);

export type KafkaMessageEnvelope<TEvent> = z.infer<
  ReturnType<typeof kafkaMessageEnvelope<z.ZodType<TEvent>>>
>;
