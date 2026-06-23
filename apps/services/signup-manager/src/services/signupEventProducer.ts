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
  // Keyed by signupUserId so all the events of one user land on the same
  // partition and consumers see them in order.
  async function publish(event: SignupEventV1): Promise<void> {
    await producer.send({
      messages: [
        { key: event.data.signupUserId, value: JSON.stringify(event) },
      ],
      topic,
    });
  }

  return {
    async publishDeletionRequestedV1Event(
      data: SignupEventData<"DeletionRequestedV1">,
    ): Promise<void> {
      await publish({ data, type: "DeletionRequestedV1" });
    },

    async publishEmailChangeRequestedV1Event(
      data: SignupEventData<"EmailChangeRequestedV1">,
    ): Promise<void> {
      await publish({ data, type: "EmailChangeRequestedV1" });
    },

    async publishOnboardingCompletedV1Event(
      data: SignupEventData<"OnboardingCompletedV1">,
    ): Promise<void> {
      await publish({ data, type: "OnboardingCompletedV1" });
    },

    async publishSuspensionRequestedV1Event(
      data: SignupEventData<"SuspensionRequestedV1">,
    ): Promise<void> {
      const event: SignupEventV1 = {
        data,
        type: "SuspensionRequestedV1",
      };

      await producer.send({
        messages: [{ value: JSON.stringify(event) }],
        topic,
      });
    },
  };
}
