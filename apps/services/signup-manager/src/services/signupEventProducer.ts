import type { createProducer } from "@knodia/kafka-commons";

import { type SignupEventV1 } from "@knodia/signup-models";

export type SignupEventProducer = ReturnType<typeof signupEventProducerBuilder>;

type SignupEventData<T extends SignupEventV1["type"]> = Extract<
  SignupEventV1,
  { type: T }
>["data"];

export function signupEventProducerBuilder({
  producer,
  topic,
}: {
  producer: Awaited<ReturnType<typeof createProducer>>;
  topic: string;
}) {
  return {
    async publishEmailChangeRequestedV1Event(
      data: SignupEventData<"EmailChangeRequestedV1">,
    ): Promise<void> {
      const event: SignupEventV1 = {
        data,
        type: "EmailChangeRequestedV1",
      };

      await producer.send({
        messages: [{ value: JSON.stringify(event) }],
        topic,
      });
    },

    async publishOnboardingCompletedV1Event(
      data: SignupEventData<"OnboardingCompletedV1">,
    ): Promise<void> {
      const event: SignupEventV1 = {
        data,
        type: "OnboardingCompletedV1",
      };

      await producer.send({
        messages: [{ value: JSON.stringify(event) }],
        topic,
      });
    },
  };
}
