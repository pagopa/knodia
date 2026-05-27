import { bffApi } from "@knodia/bff-client";
import { getOperatorsOptions } from "@knodia/bff-client/tanstack-query";
import { UserRole } from "@knodia/common-models/auth";
import { unsafeBrandUserId, type UserId } from "@knodia/common-models/ids";
import { Button, Modal, Select, SelectItem } from "@knodia/ui-kit/ui";
import { revalidateLogic, useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { match } from "ts-pattern";
import z from "zod";

import { useHasRole } from "@/contexts/auth";
import { client } from "@/libs/axios";
import { getFieldErrorMessage } from "@/utils/getFieldErrorMessage";

import type { SupportedKeychain } from "../models/commons";

import { useAddKeychainMember } from "../hooks/useKeychainMutations";

type AddKeychainMemberActionProps = SupportedKeychain;

export function AddKeychainMemberAction(
  keychain: AddKeychainMemberActionProps,
) {
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
        isOpen={isOpen}
        keychain={keychain}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}

function AddKeychainMemberModal({
  isOpen,
  keychain,
  onClose,
}: {
  isOpen: boolean;
  keychain: SupportedKeychain;
  onClose: () => void;
}) {
  const { isError, isPending, mutate } = useAddKeychainMember(keychain);

  const { data: operators = [] } = useQuery(getOperatorsOptions({ client }));

  const userOptions = operators.map((operator) => ({
    id: operator.id,
    label: operator.username,
  }));

  const isTechnicalById = new Map(
    operators.map((operator) => [
      operator.id,
      operator.roles.includes(UserRole.enum.technical),
    ]),
  );

  function handleClose() {
    form.reset();
    onClose();
  }

  const handleAddKeychainMember = (userId: UserId) => {
    mutate(userId, { onSuccess: handleClose });
  };

  const checkUserKeychainMembership = async (userId: UserId) => {
    const {
      data: { isMember },
    } = await match(keychain)
      .with({ type: "consumption" }, ({ keychainId }) =>
        bffApi.getConsumerKeychainMembership({
          client,
          path: { consumerKeychainId: keychainId, userId },
        }),
      )
      .with({ type: "api" }, ({ keychainId }) =>
        bffApi.getKnodeApiKeychainMembership({
          client,
          path: { knodeApiKeychainId: keychainId, userId },
        }),
      )
      .with({ type: "production" }, ({ keychainId }) =>
        bffApi.getProducerKeychainMembership({
          client,
          path: { producerKeychainId: keychainId, userId },
        }),
      )
      .exhaustive();

    return isMember;
  };

  const form = useForm({
    defaultValues: {
      userId: null as null | string,
    },
    onSubmit: async ({ value }) => {
      if (!value.userId) return;
      handleAddKeychainMember(unsafeBrandUserId(value.userId));
    },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: z.object({
        userId: z
          .guid("Invalid user")
          .nullable()
          .refine((value) => value !== null, "Select an operator")
          .refine(
            (value) => value === null || isTechnicalById.get(value) === true,
            "Only Technical operators can be added as members.",
          ),
      }),
      onSubmitAsync: async ({ value: { userId } }) => {
        if (!userId) return undefined;
        const isMember = await checkUserKeychainMembership(
          unsafeBrandUserId(userId),
        );

        if (isMember) {
          return {
            fields: {
              userId: { message: "User is already a member of the keychain" },
            },
          };
        }

        return undefined;
      },
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
        if (!open) handleClose();
      }}
      showErrorBanner={isError}
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
              {userOptions.map((option) => (
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
