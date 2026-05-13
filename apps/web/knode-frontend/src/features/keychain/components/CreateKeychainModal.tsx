import type { bffApi } from "@knodia/bff-client";

import {
  createConsumerKeychainMutation,
  createKnodeApiKeychainMutation,
} from "@knodia/bff-client/tanstack-query";
import {
  Modal,
  Select,
  SelectItem,
  TextArea,
  TextField,
} from "@knodia/ui-kit/ui";
import { revalidateLogic, useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { match } from "ts-pattern";

import { client } from "@/libs/axios";
import { getFieldErrorMessage } from "@/utils/getFieldErrorMessage";

import {
  createKeychainFormDefaultValues,
  createKeychainFormSchema,
  type CreateKeychainFormValues,
  keychainTypeOptions,
} from "../models/keychain-forms";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateKeychainModal({ isOpen, onClose }: Props) {
  const navigate = useNavigate();

  const {
    isError: isConsumerError,
    isPending: isConsumerPending,
    mutate: createConsumerKeychain,
  } = useMutation({
    ...createConsumerKeychainMutation({
      client,
    }),
    onSuccess: ({ id }) => {
      navigate({ params: { id }, to: "/keychains/consumption/$id" });
    },
  });

  const {
    isError: isApiError,
    isPending: isApiPending,
    mutate: createKnodeApiKeychain,
  } = useMutation({
    ...createKnodeApiKeychainMutation({
      client,
    }),
    onSuccess: () => {
      // TODO KN-618: navigate to the API keychain details page once it exists.
      navigate({ to: "/keychains" });
      onClose();
    },
  });

  const isError = isConsumerError || isApiError;
  const isPending = isConsumerPending || isApiPending;

  function handleCreateKeychain(seed: CreateKeychainFormValues) {
    const body = {
      description: seed.description ? { en: seed.description } : undefined,
      name: { en: seed.name },
    };

    match(seed.type)
      .with("consumption", () =>
        createConsumerKeychain({
          body: body satisfies bffApi.ConsumerKeychainSeed,
        }),
      )
      .with("production", () => {
        throw new Error("Producer keychains are not supported yet.");
      })
      .with("api", () =>
        createKnodeApiKeychain({
          body: body satisfies bffApi.KnodeApiKeychainSeed,
        }),
      )
      .exhaustive();
  }

  const form = useForm({
    defaultValues: createKeychainFormDefaultValues,
    onSubmit: async ({ value }) => {
      handleCreateKeychain(value);
    },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: createKeychainFormSchema,
    },
  });

  return (
    <Modal
      actionLabel="Create"
      cancelLabel="Cancel"
      confirmButtonProps={{ isPending }}
      isOpen={isOpen}
      kind="default"
      onConfirm={() => void form.handleSubmit()}
      onOpenChange={(open) => {
        if (!open) {
          form.reset();
          onClose();
        }
      }}
      showErrorBanner={isError}
      title="Create Keychain"
    >
      <form
        className="flex flex-col gap-6"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <form.Field name="name">
          {(field) => (
            <TextField
              description="Min 5 characters, max 60 characters"
              errorMessage={getFieldErrorMessage(field.state.meta.errors)}
              isInvalid={
                field.state.meta.isTouched && !field.state.meta.isValid
              }
              isRequired
              label="Name"
              name={field.name}
              onBlur={field.handleBlur}
              onChange={field.handleChange}
              value={field.state.value}
            />
          )}
        </form.Field>

        <form.Field name="description">
          {(field) => (
            <TextArea
              description="Max 250 characters"
              errorMessage={getFieldErrorMessage(field.state.meta.errors)}
              isInvalid={
                field.state.meta.isTouched && !field.state.meta.isValid
              }
              label="Description (optional)"
              name={field.name}
              onBlur={field.handleBlur}
              onChange={field.handleChange}
              value={field.state.value}
            />
          )}
        </form.Field>

        <form.Field name="type">
          {(field) => (
            <Select
              isRequired
              label="Type"
              name={field.name}
              onBlur={field.handleBlur}
              onChange={(key) =>
                field.handleChange(
                  keychainTypeOptions.find((option) => option.id === key)?.id ??
                    createKeychainFormDefaultValues.type,
                )
              }
              value={field.state.value}
            >
              {keychainTypeOptions.map((option) => (
                <SelectItem
                  id={option.id}
                  isDisabled={option.id === "production"}
                  key={option.id}
                >
                  {option.label}
                </SelectItem>
              ))}
            </Select>
          )}
        </form.Field>
      </form>
    </Modal>
  );
}
