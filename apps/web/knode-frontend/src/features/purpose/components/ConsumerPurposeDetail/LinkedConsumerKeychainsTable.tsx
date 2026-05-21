import type { bffApi } from "@knodia/bff-client";
import type { KnodeId } from "@knodia/common-models/ids";

import { unlinkPurposeFromConsumerKeychainMutation } from "@knodia/bff-client/tanstack-query";
import { Button, Modal } from "@knodia/ui-kit/ui";
import { MinusSquareIcon, SelectionPlusIcon } from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DialogTrigger } from "react-aria-components";

import { ConsumerKeychainsTable } from "@/features/keychain/components/ConsumerKeychainsTable";
import { client } from "@/libs/axios";

import {
  consumerPurposesQueryKey,
  purposeLinkedConsumerKeychainsQueryKey,
} from "../../services/queries";

interface LinkedConsumerKeychainsTableProps {
  canManagePurpose: boolean;
  isLoading: boolean;
  keychains: bffApi.Keychain[];
  knodeId: KnodeId;
  purposeId: string;
}

export function LinkedConsumerKeychainsTable({
  canManagePurpose,
  isLoading,
  keychains,
  knodeId,
  purposeId,
}: LinkedConsumerKeychainsTableProps) {
  return (
    <ConsumerKeychainsTable
      emptyState={{
        icon: <SelectionPlusIcon />,
        message:
          "Link a Keychain to this Purpose to request an access token for the related E-Service.",
      }}
      isLoading={isLoading}
      keychains={keychains}
      rowActions={
        canManagePurpose
          ? (keychain) => (
              <UnlinkConsumerKeychainAction
                consumerKeychainId={keychain.id}
                knodeId={knodeId}
                purposeId={purposeId}
              />
            )
          : undefined
      }
    />
  );
}

function UnlinkConsumerKeychainAction({
  consumerKeychainId,
  knodeId,
  purposeId,
}: {
  consumerKeychainId: string;
  knodeId: KnodeId;
  purposeId: string;
}) {
  const queryClient = useQueryClient();

  const {
    isError,
    isPending,
    mutate: unlinkKeychain,
  } = useMutation(unlinkPurposeFromConsumerKeychainMutation({ client }));

  function handleUnlinkKeychain() {
    unlinkKeychain(
      {
        path: { consumerKeychainId, purposeId },
        query: { knodeId },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: purposeLinkedConsumerKeychainsQueryKey(),
          });
          queryClient.invalidateQueries({
            queryKey: consumerPurposesQueryKey(),
          });
        },
      },
    );
  }

  return (
    <DialogTrigger>
      <Button hierarchy="danger" kind="outlined" size="sm">
        <MinusSquareIcon />
        Unlink
      </Button>
      <Modal
        actionLabel="Unlink anyway"
        cancelLabel="Cancel"
        confirmButtonProps={{ isPending }}
        description="If you unlink it, it won't be possible to use its keys to request a token. Are you sure you want to unlink this Keychain? You will be able to link it again later."
        isDismissable
        kind="destructive"
        onConfirm={handleUnlinkKeychain}
        showErrorBanner={isError}
        title="Unlink Keychain"
      />
    </DialogTrigger>
  );
}
