import type { bffApi } from "@knodia/bff-client";

import {
  getProducerEserviceDetailsQueryKey,
  getProducerEservicesQueryKey,
  updateProducerEserviceMutation,
} from "@knodia/bff-client/tanstack-query";
import { categories } from "@knodia/category-models";
import { Modal, Select, TextArea, TextField } from "@knodia/ui-kit/ui";
import { revalidateLogic, useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/libs/axios";
import { getFieldErrorMessage } from "@/utils/getFieldErrorMessage";

import { generalStepSchema } from "../types/eserviceCreateForm";
import {
  parseSchemeRefKeys,
  renderSchemeRefItems,
  toSchemeRefKey,
} from "../utils/schemeRef";

interface EditEServiceModalProps {
  eservice: bffApi.ProducerEserviceDetails;
  isOpen: boolean;
  onClose: () => void;
}

export function EditEServiceModal({
  eservice,
  isOpen,
  onClose,
}: EditEServiceModalProps) {
  const queryClient = useQueryClient();

  const {
    isError,
    isPending,
    mutate: updateEservice,
  } = useMutation({
    ...updateProducerEserviceMutation({ client }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: getProducerEserviceDetailsQueryKey({
            client,
            path: { eserviceId: eservice.id },
          }),
        }),
        queryClient.invalidateQueries({
          queryKey: getProducerEservicesQueryKey({
            client,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            query: undefined!,
          }),
        }),
      ]);
      onClose();
    },
  });

  const form = useForm({
    defaultValues: {
      categories: eservice.categories,
      description: eservice.description.en,
      name: eservice.name.en,
    },
    onSubmit: ({ value }) => {
      const body: bffApi.EservicePatch = {
        categories: value.categories,
        description: { en: value.description },
        name: { en: value.name },
      };
      updateEservice({ body, path: { eserviceId: eservice.id } });
    },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: generalStepSchema,
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
      title="Edit E-Service"
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
              description="Min 10 characters, max 250 characters"
              errorMessage={getFieldErrorMessage(field.state.meta.errors)}
              isInvalid={
                field.state.meta.isTouched && !field.state.meta.isValid
              }
              isRequired
              label="Description"
              name={field.name}
              onBlur={field.handleBlur}
              onChange={field.handleChange}
              value={field.state.value}
            />
          )}
        </form.Field>

        <form.Field name="categories">
          {(field) => (
            <Select
              label="Categories (optional)"
              name={field.name}
              onChange={(keys) => field.handleChange(parseSchemeRefKeys(keys))}
              placeholder="Select categories"
              selectionMode="multiple"
              value={field.state.value?.map(toSchemeRefKey) ?? []}
            >
              {renderSchemeRefItems(categories)}
            </Select>
          )}
        </form.Field>
      </form>
    </Modal>
  );
}
