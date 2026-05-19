import type {
  ConsumerKeychainId,
  KnodeApiKeychainId,
} from "@knodia/common-models/ids";

import { bffApi } from "@knodia/bff-client";
import {
  Banner,
  Button,
  type ButtonProps,
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
  Tooltip,
} from "@knodia/ui-kit/ui";
import {
  DownloadSimpleIcon,
  SelectionPlusIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { DialogTrigger, TooltipTrigger } from "react-aria-components";
import { match } from "ts-pattern";

import { client } from "@/libs/axios";
import { downloadResponseAsFile } from "@/utils/downloadFile";
import { formatShortDate } from "@/utils/formatters";

import type { SupportedKeychainType } from "../models/commons";

import { useRemoveKeychainKey } from "../hooks/useKeychainMutations";

interface KeychainPublicKeysTableProps {
  canDownloadKey: boolean;
  isLoading: boolean;
  keychainId: ConsumerKeychainId | KnodeApiKeychainId;
  keys: bffApi.KeychainKey[];
  type: SupportedKeychainType;
}

export function KeychainPublicKeysTable({
  canDownloadKey,
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
            <Cell className="body-md">
              {key?.uploaderUsername ?? "Removed User"}
            </Cell>
            <Cell className="body-md">{formatShortDate(key.createdAt)}</Cell>
            <Cell className="body-sm text-primary-light-high-contrast">
              <div className="flex items-center">
                {key.kid} <CopyButton className="ml-2" textToCopy={key.kid} />
              </div>
            </Cell>
            <Cell>
              <div className="flex justify-end gap-2">
                <DownloadPublicKeyAction
                  canDownloadKey={canDownloadKey}
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

function DisabledTooltipButton({
  children,
  tooltip,
  ...props
}: Omit<ButtonProps, "onClick" | "onPress"> & { tooltip: React.ReactNode }) {
  return (
    <TooltipTrigger>
      <Button
        {...props}
        aria-disabled
        className="cursor-not-allowed opacity-30 hover:cursor-not-allowed hover:bg-transparent pressed:bg-transparent"
      >
        {children}
      </Button>
      <Tooltip>{tooltip}</Tooltip>
    </TooltipTrigger>
  );
}

function DownloadPublicKeyAction({
  canDownloadKey,
  keychainId,
  keyId,
  type,
}: {
  canDownloadKey: boolean;
  keychainId: ConsumerKeychainId | KnodeApiKeychainId;
  keyId: string;
  type: SupportedKeychainType;
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
        .with("api", () =>
          bffApi.downloadKnodeApiKeychainKey({
            client,
            path: {
              keyId,
              knodeApiKeychainId: keychainId,
            },
          }),
        )
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

  const content = (
    <>
      <DownloadSimpleIcon />
      <span className="sr-only">Download public key</span>
    </>
  );

  const commonButtonProps: ButtonProps = {
    hierarchy: "neutral",
    kind: "outlined",
    size: "icon-sm",
  };

  if (!canDownloadKey) {
    return (
      <DisabledTooltipButton
        {...commonButtonProps}
        tooltip="Only Keychain members can download public keys"
      >
        {content}
      </DisabledTooltipButton>
    );
  }

  return (
    <Button {...commonButtonProps} onPress={handleDownloadPublicKey}>
      {content}
    </Button>
  );
}

function RemoveFromKeychainAction({
  keychainId,
  keyId,
  type,
}: {
  keychainId: ConsumerKeychainId | KnodeApiKeychainId;
  keyId: string;
  type: SupportedKeychainType;
}) {
  const { isError, isPending, mutate } = useRemoveKeychainKey(keychainId, type);

  function handleDelete() {
    mutate(keyId);
  }

  return (
    <DialogTrigger>
      <Button hierarchy="danger" kind="outlined" size="icon-sm">
        <TrashIcon />
        <span className="sr-only">Delete public key</span>
      </Button>
      <Modal
        actionLabel="Delete anyway"
        cancelLabel="Cancel"
        confirmButtonProps={{ isPending }}
        description="Are you sure you want to delete this public key? This action cannot be undone. If you are unsure, download the key before deleting it."
        isDismissable
        kind="destructive"
        onConfirm={handleDelete}
        showErrorBanner={isError}
        title="Delete public key"
      />
    </DialogTrigger>
  );
}
