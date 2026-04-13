import {
  addConsumerKeychainMemberMutation,
  getConsumerKeychainMembersQueryKey,
  getTechnicalUsersOptions,
} from "@knodia/bff-client/tanstack-query";
import { Button, Modal, Select, SelectItem } from "@knodia/ui-kit/ui";
import { revalidateLogic, useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { match } from "ts-pattern";
import z from "zod";

import { useHasRole } from "@/contexts/auth";
import { client } from "@/libs/axios";
import { getFieldErrorMessage } from "@/utils/getFieldErrorMessage";

import type { KeychainType } from "../models/commons";

interface AddKeychainMemberActionProps {
  alreadyKeychainMembersIds: string[];
  keychainId: string;
  keychainType: KeychainType;
}

export function AddKeychainMemberAction({
  alreadyKeychainMembersIds,
  keychainId,
  keychainType,
}: AddKeychainMemberActionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isAdmin = useHasRole("administrative");

  if (!isAdmin) return null;

  return (
    <>
      <Button
        hierarchy="brand"
        kind="filled"
        onClick={() => setIsOpen(true)}
        size="md"
      >
        Add member
      </Button>
      <AddKeychainMemberModal
        alreadyKeychainMembersIds={alreadyKeychainMembersIds}
        isOpen={isOpen}
        keychainId={keychainId}
        keychainType={keychainType}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}

function AddKeychainMemberModal({
  alreadyKeychainMembersIds,
  isOpen,
  keychainId,
  keychainType,
  onClose,
}: {
  alreadyKeychainMembersIds: string[];
  isOpen: boolean;
  keychainId: string;
  keychainType: KeychainType;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { isPending, mutate: addConsumerKeychainMember } = useMutation({
    ...addConsumerKeychainMemberMutation({ client }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: getConsumerKeychainMembersQueryKey({
          client,
          path: { consumerKeychainId: keychainId },
        }),
      });
      onClose();
    },
  });

  const { data = [] } = useQuery(getTechnicalUsersOptions({ client }));

  const technicalUsersOptions = data.map((user) => ({
    id: user.id,
    label: user.username,
  }));

  const handleAddKeychainMember = (userId: string) => {
    match(keychainType)
      .with("consumption", () =>
        addConsumerKeychainMember({
          body: { userId },
          path: { consumerKeychainId: keychainId },
        }),
      )
      .with("production", () => {
        throw new Error("Producer keychains are not supported yet.");
      })
      .with("api", () => {
        throw new Error("API keychains are not supported yet.");
      })
      .exhaustive();
  };

  const form = useForm({
    defaultValues: {
      userId: null as null | string,
    },
    onSubmit: async ({ value }) => {
      if (!value.userId) return;
      handleAddKeychainMember(value.userId);
    },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: z.object({
        userId: z
          .guid("Invalid user")
          .nullable()
          .refine((value) => value !== null, "Select an operator"),
      }),
    },
  });

  return (
    <Modal
      actionLabel="Add"
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
      title="Add Member"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <form.Field name="userId">
          {(field) => (
            <Select
              errorMessage={getFieldErrorMessage(field.state.meta.errors)}
              isInvalid={
                field.state.meta.isTouched && !field.state.meta.isValid
              }
              isRequired
              label="Organization operators"
              name={field.name}
              onBlur={field.handleBlur}
              onChange={(key) => field.handleChange((key as string) ?? null)}
              placeholder="Select an option..."
              value={field.state.value}
            >
              {technicalUsersOptions.map((option) => (
                <SelectItem
                  id={option.id}
                  isDisabled={alreadyKeychainMembersIds.includes(option.id)}
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
