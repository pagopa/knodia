import type { bffApi } from "@knodia/bff-client";

import { updateConsumerKeychainMutation } from "@knodia/bff-client/tanstack-query";
import { Button, Modal, TextArea, TextField } from "@knodia/ui-kit/ui";
import { revalidateLogic, useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { match } from "ts-pattern";

import { getFieldErrorMessage } from "@/features/e-service/utils/getFieldErrorMessage";
import { client } from "@/libs/axios";

import type { KeychainType } from "../models/commons";

import {
  editKeychainFormSchema,
  type EditKeychainFormValues,
} from "../models/keychain-forms";

interface EditKeychainModalProps {
  isOpen: boolean;
  keychain: bffApi.KeychainDetails;
  onClose: () => void;
  type: KeychainType;
}

interface KeychainEditActionProps {
  keychain: bffApi.KeychainDetails;
  type: KeychainType;
}

export function KeychainEditAction({
  keychain,
  type,
}: KeychainEditActionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        hierarchy="neutral"
        kind="tonal"
        onClick={() => setIsOpen(true)}
        size="md"
      >
        Edit
      </Button>
      {isOpen && (
        <EditKeychainModal
          isOpen={isOpen}
          keychain={keychain}
          onClose={() => setIsOpen(false)}
          type={type}
        />
      )}
    </>
  );
}

function EditKeychainModal({
  isOpen,
  keychain,
  onClose,
  type,
}: EditKeychainModalProps) {
  const { isPending, mutate: editConsumerKeychain } = useMutation({
    ...updateConsumerKeychainMutation({
      client,
    }),
  });

  function handleEditKeychain(seed: EditKeychainFormValues) {
    const body: bffApi.ConsumerKeychainPatch = {
      description: seed.description ? { en: seed.description } : undefined,
      name: { en: seed.name },
    };

    match(type)
      .with("consumption", () =>
        editConsumerKeychain({
          body,
          path: { consumerKeychainId: keychain.id },
        }),
      )
      .with("production", () => {
        throw new Error("Producer keychains are not supported yet.");
      })
      .with("api", () => {
        throw new Error("API keychains are not supported yet.");
      })
      .exhaustive();
  }

  const form = useForm({
    defaultValues: {
      name: keychain.name.en,
      ...(keychain.description ? { description: keychain.description.en } : {}),
    },
    onSubmit: async ({ value }) => {
      handleEditKeychain(value);
    },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: editKeychainFormSchema,
    },
  });

  return (
    <Modal
      actionLabel="Confirm"
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
      title="Edit Keychain"
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
      </form>
    </Modal>
  );
}
