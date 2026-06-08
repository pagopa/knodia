import type { createProducer } from "@knodia/kafka-commons";

import { type SignupEventV1 } from "@knodia/signup-models";

export type SignupEventProducer = ReturnType<typeof signupEventProducerBuilder>;

export function signupEventProducerBuilder({
  producer,
  topic,
}: {
  producer: Awaited<ReturnType<typeof createProducer>>;
  topic: string;
}) {
  return {
    async publishOnboardingCompletedV1Event(
      data: SignupEventV1["data"],
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
