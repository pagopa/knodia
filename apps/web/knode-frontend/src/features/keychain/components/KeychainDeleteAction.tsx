import type {
  ConsumerKeychainId,
  KnodeApiKeychainId,
} from "@knodia/common-models/ids";

import { bffApi } from "@knodia/bff-client";
import { Button, Modal } from "@knodia/ui-kit/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { DialogTrigger } from "react-aria-components";
import { match } from "ts-pattern";

import { client } from "@/libs/axios";

import type { KeychainType } from "../models/commons";

import {
  consumerKeychainsQueryKey,
  knodeApiKeychainsQueryKey,
} from "../services/queries";

export function KeychainDeleteAction({
  keychainId,
  type,
}: {
  keychainId: ConsumerKeychainId | KnodeApiKeychainId;
  type: KeychainType;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    isError,
    isPending: isDeleting,
    mutate,
  } = useMutation({
    mutationFn: () =>
      match(type)
        .with("consumption", () =>
          bffApi.deleteConsumerKeychain({
            client,
            path: { consumerKeychainId: keychainId },
          }),
        )
        .with("api", () =>
          bffApi.deleteKnodeApiKeychain({
            client,
            path: { knodeApiKeychainId: keychainId },
          }),
        )
        .with("production", () => {
          throw new Error("Producer keychains are not supported yet.");
        })
        .exhaustive(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: match(type)
          .with("consumption", () => consumerKeychainsQueryKey())
          .with("api", () => knodeApiKeychainsQueryKey())
          .with("production", () => {
            throw new Error("Producer keychains are not supported yet.");
          })
          .exhaustive(),
      });
      match(type)
        .with("consumption", () =>
          navigate({
            search: { offset: 0, type: "consumption" },
            to: "/keychains",
          }),
        )
        .with("api", () =>
          navigate({ search: { offset: 0, type: "api" }, to: "/keychains" }),
        )
        .with("production", () => {
          throw new Error("Producer keychains are not supported yet.");
        })
        .exhaustive();
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
