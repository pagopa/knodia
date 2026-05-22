import { type bffApi } from "@knodia/bff-client";
import { Button, Modal, TextArea, TextField } from "@knodia/ui-kit/ui";
import { revalidateLogic, useForm } from "@tanstack/react-form";
import { useState } from "react";
import { DialogTrigger } from "react-aria-components";

import { getFieldErrorMessage } from "@/utils/getFieldErrorMessage";

import type { SupportedKeychain } from "../models/commons";

import { useEditKeychain } from "../hooks/useEditKeychain";
import {
  editKeychainFormSchema,
  type EditKeychainFormValues,
} from "../models/keychain-forms";

type EditKeychainModalProps = KeychainEditActionProps & {
  isOpen: boolean;
  onClose: () => void;
};

type KeychainEditActionProps = SupportedKeychain & {
  keychain: bffApi.KeychainDetails;
};

export function KeychainEditAction(props: KeychainEditActionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DialogTrigger>
      <Button
        hierarchy="neutral"
        kind="tonal"
        onClick={() => setIsOpen(true)}
        size="md"
      >
        Edit
      </Button>
      <EditKeychainModal
        {...props}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </DialogTrigger>
  );
}

function EditKeychainModal(props: EditKeychainModalProps) {
  const { isOpen, keychain, onClose } = props;
  const { isError, isPending, mutate } = useEditKeychain(props);

  function handleEditKeychain(seed: EditKeychainFormValues) {
    mutate(
      {
        description: seed.description ? { en: seed.description } : null,
        name: { en: seed.name },
      },
      { onSuccess: onClose },
    );
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
      showErrorBanner={isError}
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
