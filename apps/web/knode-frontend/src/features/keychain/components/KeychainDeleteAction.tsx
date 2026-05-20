import { bffApi } from "@knodia/bff-client";
import { Button, Modal } from "@knodia/ui-kit/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { DialogTrigger } from "react-aria-components";
import { match } from "ts-pattern";

import { client } from "@/libs/axios";

import type { SupportedKeychain } from "../models/commons";

import {
  consumerKeychainsQueryKey,
  knodeApiKeychainsQueryKey,
} from "../services/queries";

export function KeychainDeleteAction(keychain: SupportedKeychain) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    isError,
    isPending: isDeleting,
    mutate,
  } = useMutation({
    mutationFn: () =>
      match(keychain)
        .with({ type: "consumption" }, ({ keychainId }) =>
          bffApi.deleteConsumerKeychain({
            client,
            path: { consumerKeychainId: keychainId },
          }),
        )
        .with({ type: "api" }, ({ keychainId }) =>
          bffApi.deleteKnodeApiKeychain({
            client,
            path: { knodeApiKeychainId: keychainId },
          }),
        )
        .exhaustive(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: match(keychain)
          .with({ type: "consumption" }, () => consumerKeychainsQueryKey())
          .with({ type: "api" }, () => knodeApiKeychainsQueryKey())
          .exhaustive(),
      });
      navigate({
        search: { offset: 0, type: keychain.type },
        to: "/keychains",
      });
    },
  });

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
        onConfirm={() => mutate()}
        showErrorBanner={isError}
        title="Delete Keychain"
      />
    </DialogTrigger>
  );
}
