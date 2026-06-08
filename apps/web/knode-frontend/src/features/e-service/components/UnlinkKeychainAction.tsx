import type { bffApi } from "@knodia/bff-client";

import {
  type EserviceId,
  type ProducerKeychainId,
  unsafeBrandId,
} from "@knodia/common-models/ids";
import { Button, Modal } from "@knodia/ui-kit/ui";
import { MinusSquareIcon } from "@phosphor-icons/react";
import { useState } from "react";

import { useUnlinkKeychainFromEservice } from "../hooks/useEserviceKeychainMutations";

export function UnlinkKeychainAction({
  eserviceId,
  keychain,
}: {
  eserviceId: EserviceId;
  keychain: bffApi.Keychain;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { isError, isPending, mutate } =
    useUnlinkKeychainFromEservice(eserviceId);

  const handleUnlink = () => {
    mutate(unsafeBrandId<ProducerKeychainId>(keychain.id), {
      onSuccess: () => setIsOpen(false),
    });
  };

  return (
    <>
      <Button
        hierarchy="danger"
        kind="outlined"
        onClick={() => setIsOpen(true)}
        size="sm"
      >
        <MinusSquareIcon />
        Unlink
      </Button>
      <Modal
        actionLabel="Unlink anyway"
        cancelLabel="Cancel"
        confirmButtonProps={{ isPending }}
        description={
          <>
            If you unlink it, you must not use its keys to sign responses from
            this E-Service. Are you sure you want to unlink this Keychain?
            <br />
            You will be able to link it again later.
          </>
        }
        isOpen={isOpen}
        kind="destructive"
        onConfirm={handleUnlink}
        onOpenChange={setIsOpen}
        showErrorBanner={isError}
        title="Unlink Keychain"
      />
    </>
  );
}
