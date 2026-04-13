import { bffApi } from "@knodia/bff-client";
import {
  getConsumerKeychainKeysQueryKey,
  removeConsumerKeychainKeyMutation,
} from "@knodia/bff-client/tanstack-query";
import {
  Banner,
  Button,
  Cell,
  Column,
  CopyButton,
  Loader,
  Modal,
  Row,
  Table,
  TableBody,
  TableHeader,
  toastQueue,
} from "@knodia/ui-kit/ui";
import {
  DownloadSimpleIcon,
  SelectionPlusIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DialogTrigger } from "react-aria-components";
import { match } from "ts-pattern";

import { client } from "@/libs/axios";
import { downloadResponseAsFile } from "@/utils/downloadFile";
import { formatShortDate } from "@/utils/formatters";

import type { KeychainType } from "../models/commons";

interface KeychainPublicKeysTableProps {
  isLoading: boolean;
  keychainId: string;
  keys: bffApi.KeychainKey[];
  type: KeychainType;
}

export function KeychainPublicKeysTable({
  isLoading,
  keychainId,
  keys,
  type,
}: KeychainPublicKeysTableProps) {
  if (isLoading) {
    return <Loader className="mx-auto mt-20" label="Loading..." />;
  }

  if (keys.length === 0) {
    return (
      <Banner icon={<SelectionPlusIcon />} kind="neutral">
        You don&apos;t have a public key yet. Upload your first one.
      </Banner>
    );
  }

  return (
    <Table aria-label="Keychains table">
      <TableHeader>
        <Column id="name" isRowHeader>
          Name
        </Column>
        <Column id="owner">Owner</Column>
        <Column id="creation-date">Creation date</Column>
        <Column id="kid">ID (kid)</Column>
        <Column id="actions">
          <span className="sr-only">Actions</span>
        </Column>
      </TableHeader>
      <TableBody items={keys}>
        {(key) => (
          <Row id={key.kid}>
            <Cell>
              <span className="body-md-em">{key.name.en}</span>
            </Cell>
            <Cell>{key?.uploaderUsername ?? "Removed User"}</Cell>
            <Cell>{formatShortDate(key.createdAt)}</Cell>
            <Cell>
              <div className="flex items-center">
                {key.kid} <CopyButton className="ml-2" textToCopy={key.kid} />
              </div>
            </Cell>
            <Cell>
              <div className="flex justify-end gap-2">
                <DownloadPublicKeyAction
                  keychainId={keychainId}
                  keyId={key.kid}
                  type={type}
                />
                <RemoveFromKeychainAction
                  keychainId={keychainId}
                  keyId={key.kid}
                  type={type}
                />
              </div>
            </Cell>
          </Row>
        )}
      </TableBody>
    </Table>
  );
}

function DownloadPublicKeyAction({
  keychainId,
  keyId,
  type,
}: {
  keychainId: string;
  keyId: string;
  type: KeychainType;
}) {
  async function handleDownloadPublicKey() {
    try {
      const response = await match(type)
        .with("consumption", () =>
          bffApi.downloadConsumerKeychainKey({
            client,
            path: {
              consumerKeychainId: keychainId,
              keyId,
            },
          }),
        )
        .with("production", () => {
          throw new Error("Producer keychains are not supported yet.");
        })
        .with("api", () => {
          throw new Error("API keychains are not supported yet.");
        })
        .exhaustive();

      downloadResponseAsFile(
        response.data,
        `public_key_${keyId}.pem`,
        response.headers["content-type"],
      );
    } catch {
      toastQueue.add({
        description: "Retry later",
        kind: "error",
        title: "Download failed",
      });
    }
  }

  return (
    <Button
      hierarchy="neutral"
      kind="outlined"
      onPress={handleDownloadPublicKey}
      size="icon-sm"
    >
      <DownloadSimpleIcon />
      <span className="sr-only">Download public key</span>
    </Button>
  );
}

function RemoveFromKeychainAction({
  keychainId,
  keyId,
  type,
}: {
  keychainId: string;
  keyId: string;
  type: KeychainType;
}) {
  const queryClient = useQueryClient();
  const { isPending, mutate: deleteConsumerKeychainKey } = useMutation({
    ...removeConsumerKeychainKeyMutation({ client }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: getConsumerKeychainKeysQueryKey({
          client,
          path: { consumerKeychainId: keychainId },
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          query: undefined!,
        }),
      });
    },
  });

  function handleDelete() {
    match(type)
      .with("consumption", () => {
        deleteConsumerKeychainKey({
          path: {
            consumerKeychainId: keychainId,
            keyId,
          },
        });
      })
      .with("production", () => {
        throw new Error("Producer keychains are not supported yet.");
      })
      .with("api", () => {
        throw new Error("API keychains are not supported yet.");
      })
      .exhaustive();
  }

  return (
    <DialogTrigger>
      <Button hierarchy="danger" kind="outlined" size="icon-sm">
        <TrashIcon />
        <span className="sr-only">Delete public key</span>
      </Button>
      <Modal
        actionLabel="Delete anyway"
        confirmButtonProps={{ isPending }}
        description="Are you sure you want to delete this public key? This action cannot be undone. If you are unsure, download the key before deleting it."
        isDismissable
        kind="destructive"
        onConfirm={handleDelete}
        title="Delete public key"
      />
    </DialogTrigger>
  );
}
