import { bffApi } from "@knodia/bff-client";
import {
  addConsumerKeychainMemberMutation,
  getConsumerKeychainMembershipQueryKey,
  getConsumerKeychainMembersQueryKey,
  getOperatorsOptions,
} from "@knodia/bff-client/tanstack-query";
import { UserRole } from "@knodia/common-models/auth";
import { unsafeBrandUserId, type UserId } from "@knodia/common-models/ids";
import { Button, Modal, Select, SelectItem } from "@knodia/ui-kit/ui";
import { revalidateLogic, useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { match } from "ts-pattern";
import z from "zod";

import { useAuth, useHasRole } from "@/contexts/auth";
import { client } from "@/libs/axios";
import { getFieldErrorMessage } from "@/utils/getFieldErrorMessage";

import type { KeychainType } from "../models/commons";

interface AddKeychainMemberActionProps {
  keychainId: string;
  keychainType: KeychainType;
}

export function AddKeychainMemberAction({
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
        isOpen={isOpen}
        keychainId={keychainId}
        keychainType={keychainType}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}

function AddKeychainMemberModal({
  isOpen,
  keychainId,
  keychainType,
  onClose,
}: {
  isOpen: boolean;
  keychainId: string;
  keychainType: KeychainType;
  onClose: () => void;
}) {
  const { userId } = useAuth();

  const queryClient = useQueryClient();
  const {
    isError,
    isPending,
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

  const checkUserKeychainMembership = async (userId: UserId) => {
    const {
      data: { isMember },
    } = await match(keychainType)
      .with("consumption", () =>
        bffApi.getConsumerKeychainMembership({
          client,
          path: { consumerKeychainId: keychainId, userId },
        }),
      )
      .with("production", () => {
        throw new Error("Producer keychains are not supported yet.");
      })
      .with("api", () => {
        throw new Error("API keychains are not supported yet.");
      })
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
