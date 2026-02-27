import type { z } from "zod";

import {
  Modal,
  Select,
  SelectItem,
  TextArea,
  TextField,
} from "@knodia/ui-kit/ui";
import { revalidateLogic, useForm } from "@tanstack/react-form";

import { createKeychainFormSchema } from "../models/create-keychain-form";

const keychainTypeOptions = [
  { id: "consumer", label: "Consumer" },
  { id: "producer", label: "Producer" },
  { id: "api", label: "API" },
] as const;

type CreateKeychainFormValues = z.infer<typeof createKeychainFormSchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreate?: (value: CreateKeychainFormValues) => Promise<void> | void;
}

export function CreateKeychainModal({ isOpen, onClose, onCreate }: Props) {
  const defaultValues: CreateKeychainFormValues = {
    description: "",
    name: "",
    type: "consumer",
  };

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      await onCreate?.(value);
      form.reset();
      onClose();
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
      isOpen={isOpen}
      kind="default"
      onConfirm={() => void form.handleSubmit()}
      onOpenChange={(open) => {
        if (!open) {
          form.reset();
          onClose();
        }
      }}
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
                    defaultValues.type,
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

function getFieldErrorMessage(errors: unknown[]): string {
  return errors
    .filter(hasMessage)
    .map((error) => error.message)
    .join(", ");
}

function hasMessage(error: unknown): error is { message: string } {
  return !!error && typeof error === "object" && "message" in error;
}
