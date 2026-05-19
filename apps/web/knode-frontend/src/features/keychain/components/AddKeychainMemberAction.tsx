import { bffApi } from "@knodia/bff-client";
import {
  addConsumerKeychainMemberMutation,
  addKnodeApiKeychainMemberMutation,
  getConsumerKeychainMembershipQueryKey,
  getConsumerKeychainMembersQueryKey,
  getKnodeApiKeychainMembershipQueryKey,
  getKnodeApiKeychainMembersQueryKey,
  getOperatorsOptions,
} from "@knodia/bff-client/tanstack-query";
import { UserRole } from "@knodia/common-models/auth";
import {
  type ConsumerKeychainId,
  type KnodeApiKeychainId,
  unsafeBrandUserId,
  type UserId,
} from "@knodia/common-models/ids";
import { Button, Modal, Select, SelectItem } from "@knodia/ui-kit/ui";
import { revalidateLogic, useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { match } from "ts-pattern";
import z from "zod";

import { useAuth, useHasRole } from "@/contexts/auth";
import { client } from "@/libs/axios";
import { getFieldErrorMessage } from "@/utils/getFieldErrorMessage";

import type { SupportedKeychainType } from "../models/commons";

interface AddKeychainMemberActionProps {
  keychainId: ConsumerKeychainId | KnodeApiKeychainId;
  type: SupportedKeychainType;
}

export function AddKeychainMemberAction({
  keychainId,
  type,
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
        isOpen={isOpen}
        keychainId={keychainId}
        onClose={() => setIsOpen(false)}
        type={type}
      />
    </>
  );
}

// eslint-disable-next-line max-lines-per-function
function AddKeychainMemberModal({
  isOpen,
  keychainId,
  onClose,
  type,
}: {
  isOpen: boolean;
  keychainId: ConsumerKeychainId | KnodeApiKeychainId;
  onClose: () => void;
  type: SupportedKeychainType;
}) {
  const { userId } = useAuth();

  const queryClient = useQueryClient();
  const {
    isError: isConsumerError,
    isPending: isConsumerPending,
    mutate: addConsumerKeychainMember,
  } = useMutation({
    ...addConsumerKeychainMemberMutation({ client }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: getConsumerKeychainMembersQueryKey({
          client,
          path: { consumerKeychainId: keychainId },
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          query: undefined!,
        }),
      });
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: getConsumerKeychainMembershipQueryKey({
            client,
            path: { consumerKeychainId: keychainId, userId },
          }),
        });
      }
      onClose();
    },
  });

  const {
    isError: isApiError,
    isPending: isApiPending,
    mutate: addKnodeApiKeychainMember,
  } = useMutation({
    ...addKnodeApiKeychainMemberMutation({ client }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: getKnodeApiKeychainMembersQueryKey({
          client,
          path: { knodeApiKeychainId: keychainId },
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          query: undefined!,
        }),
      });
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: getKnodeApiKeychainMembershipQueryKey({
            client,
            path: { knodeApiKeychainId: keychainId, userId },
          }),
        });
      }
      onClose();
    },
  });

  const isError = isConsumerError || isApiError;
  const isPending = isConsumerPending || isApiPending;

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

  const handleAddKeychainMember = (userId: UserId) => {
    match(type)
      .with("consumption", () =>
        addConsumerKeychainMember({
          body: { userId },
          path: { consumerKeychainId: keychainId },
        }),
      )
      .with("api", () =>
        addKnodeApiKeychainMember({
          body: { userId },
          path: { knodeApiKeychainId: keychainId },
        }),
      )
      .exhaustive();
  };

  const checkUserKeychainMembership = async (userId: UserId) => {
    const {
      data: { isMember },
    } = await match(type)
      .with("consumption", () =>
        bffApi.getConsumerKeychainMembership({
          client,
          path: { consumerKeychainId: keychainId, userId },
        }),
      )
      .with("api", () =>
        bffApi.getKnodeApiKeychainMembership({
          client,
          path: { knodeApiKeychainId: keychainId, userId },
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
        if (!open) {
          form.reset();
          onClose();
        }
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
