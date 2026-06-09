import type { bffApi } from "@knodia/bff-client";

import {
  Modal,
  Select,
  SelectItem,
  TextArea,
  TextField,
} from "@knodia/ui-kit/ui";
import { revalidateLogic, useForm } from "@tanstack/react-form";

import { getFieldErrorMessage } from "@/utils/getFieldErrorMessage";

import type { KeychainType } from "../models/commons";

import { useCreateKeychain } from "../hooks/useCreateKeychain";
import {
  createKeychainFormDefaultValues,
  createKeychainFormSchema,
  type CreateKeychainFormValues,
  keychainTypeOptions,
} from "../models/keychain-forms";

interface CreateKeychainFormProps {
  defaultType: KeychainType;
  onClose: () => void;
}

interface Props {
  defaultType: KeychainType;
  isOpen: boolean;
  onClose: () => void;
}

export function CreateKeychainModal({ defaultType, isOpen, onClose }: Props) {
  return isOpen ? (
    <CreateKeychainForm defaultType={defaultType} onClose={onClose} />
  ) : null;
}

function CreateKeychainForm({ defaultType, onClose }: CreateKeychainFormProps) {
  const { isError, isPending, mutate: createKeychain } = useCreateKeychain();

  function handleCreateKeychain(seed: CreateKeychainFormValues) {
    const body = {
      description: seed.description ? { en: seed.description } : undefined,
      name: { en: seed.name },
    } satisfies bffApi.KeychainSeed;

    createKeychain({ body, type: seed.type });
  }

  const form = useForm({
    defaultValues: { ...createKeychainFormDefaultValues, type: defaultType },
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
      isOpen
      kind="default"
      onConfirm={() => void form.handleSubmit()}
      onOpenChange={(open) => {
        if (!open) {
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
                <SelectItem id={option.id} key={option.id}>
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
