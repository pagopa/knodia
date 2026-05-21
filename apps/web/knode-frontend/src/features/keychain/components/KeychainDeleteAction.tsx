import { Button, Modal } from "@knodia/ui-kit/ui";
import { DialogTrigger } from "react-aria-components";

import type { SupportedKeychain } from "../models/commons";

import { useDeleteKeychain } from "../hooks/useDeleteKeychain";

export function KeychainDeleteAction(keychain: SupportedKeychain) {
  const {
    isError,
    isPending: isDeleting,
    mutate,
  } = useDeleteKeychain(keychain);

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
