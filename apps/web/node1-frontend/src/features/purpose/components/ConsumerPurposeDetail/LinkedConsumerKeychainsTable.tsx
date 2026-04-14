import type { bffApi } from "@knodia/bff-client";
import type { KnodeId } from "@knodia/common-models/ids";

import { unlinkPurposeFromConsumerKeychainMutation } from "@knodia/bff-client/tanstack-query";
import {
  Banner,
  Button,
  Cell,
  Column,
  Loader,
  Modal,
  Row,
  Table,
  TableBody,
  TableHeader,
} from "@knodia/ui-kit/ui";
import {
  ArrowRightIcon,
  MinusSquareIcon,
  SelectionPlusIcon,
} from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DialogTrigger } from "react-aria-components";

import { ButtonLinkWithPreload } from "@/components/routerLinks";
import { client } from "@/libs/axios";

import { purposeLinkedConsumerKeychainsQueryKey } from "../../services/queries";

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
  if (isLoading) {
    return <Loader className="mx-auto mt-20" label="Loading..." />;
  }

  if (keychains.length === 0) {
    return (
      <Banner icon={<SelectionPlusIcon />} kind="neutral">
        Link a Keychain to this Purpose to request an access token for the
        related E-Service.
      </Banner>
    );
  }

  return (
    <Table aria-label="Keychains table">
      <TableHeader>
        <Column id="name" isRowHeader>
          Name
        </Column>
        <Column id="keys">Keys</Column>
        <Column id="actions">
          <span className="sr-only">Actions</span>
        </Column>
      </TableHeader>
      <TableBody items={keychains}>
        {(keychain) => (
          <Row id={keychain.id}>
            <Cell>
              <span className="body-md-em">{keychain.name.en}</span>
            </Cell>
            <Cell>{keychain.keysCount}</Cell>
            <Cell>
              <div className="flex justify-end">
                {canManagePurpose && (
                  <UnlinkConsumerKeychainAction
                    consumerKeychainId={keychain.id}
                    knodeId={knodeId}
                    purposeId={purposeId}
                  />
                )}
                <ButtonLinkWithPreload
                  hierarchy="neutral"
                  kind="outlined"
                  params={{ id: keychain.id }}
                  size="icon-sm"
                  to={"/keychains/consumption/$id"}
                >
                  <ArrowRightIcon />
                </ButtonLinkWithPreload>
              </div>
            </Cell>
          </Row>
        )}
      </TableBody>
    </Table>
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
            queryKey: purposeLinkedConsumerKeychainsQueryKey(
              purposeId,
              knodeId,
            ),
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
