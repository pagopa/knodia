import type {
  ConsumerKeychainId,
  KnodeApiKeychainId,
} from "@knodia/common-models/ids";

import {
  deleteConsumerKeychainMutation,
  deleteKnodeApiKeychainMutation,
} from "@knodia/bff-client/tanstack-query";
import { Button, Modal } from "@knodia/ui-kit/ui";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { DialogTrigger } from "react-aria-components";
import { match } from "ts-pattern";

import { client } from "@/libs/axios";

import type { KeychainType } from "../models/commons";

export function KeychainDeleteAction({
  keychainId,
  type,
}: {
  keychainId: ConsumerKeychainId | KnodeApiKeychainId;
  type: KeychainType;
}) {
  const navigate = useNavigate();
  const {
    isError: isConsumerError,
    isPending: isConsumerDeleting,
    mutate: deleteConsumerKeychain,
  } = useMutation({
    ...deleteConsumerKeychainMutation({ client }),
    onSuccess: () => navigate({ to: "/keychains" }),
  });

  const {
    isError: isApiError,
    isPending: isApiDeleting,
    mutate: deleteKnodeApiKeychain,
  } = useMutation({
    ...deleteKnodeApiKeychainMutation({ client }),
    onSuccess: () =>
      navigate({ search: { offset: 0, type: "api" }, to: "/keychains" }),
  });

  const isError = isConsumerError || isApiError;
  const isDeleting = isConsumerDeleting || isApiDeleting;

  function handleDelete() {
    match(type)
      .with("consumption", () =>
        deleteConsumerKeychain({ path: { consumerKeychainId: keychainId } }),
      )
      .with("production", () => {
        throw new Error("Producer keychains are not supported yet.");
      })
      .with("api", () =>
        deleteKnodeApiKeychain({ path: { knodeApiKeychainId: keychainId } }),
      )
      .exhaustive();
  }

  return (
    <DialogTrigger>
      <Button hierarchy="danger" kind="tonal" size="md">
        Delete
      </Button>
      <Modal
        actionLabel="Delete anyway"
        cancelLabel="Cancel"
        confirmButtonProps={{ isPending: isDeleting }}
        description="Are you sure you want to delete this Keychain? All its public keys will be deleted. This action cannot be undone."
        isDismissable
        kind="destructive"
        onConfirm={handleDelete}
        showErrorBanner={isError}
        title="Delete Keychain"
      />
    </DialogTrigger>
  );
}
