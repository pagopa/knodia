import type { bffApi } from "@knodia/bff-client";

import {
  archiveProducerEserviceMutation,
  getProducerEserviceDetailsQueryKey,
  getProducerEservicesQueryKey,
  reactivateEserviceMutation,
  suspendEserviceMutation,
} from "@knodia/bff-client/tanstack-query";
import { Button, Modal, toastQueue } from "@knodia/ui-kit/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { match } from "ts-pattern";

import { client } from "@/libs/axios";

interface EserviceProducerActionsProps {
  editAction?: React.ReactNode;
  eserviceId: string;
  state: bffApi.EserviceVersionState;
}

export function EserviceProducerActions({
  editAction,
  eserviceId,
  state,
}: EserviceProducerActionsProps) {
  const queryClient = useQueryClient();
  const [isSuspendDialogOpen, setIsSuspendDialogOpen] = useState(false);
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);

  const invalidateEserviceQueries = () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: getProducerEserviceDetailsQueryKey({
          client,
          path: { eserviceId },
        }),
      }),
      queryClient.invalidateQueries({
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        queryKey: getProducerEservicesQueryKey({ client, query: undefined! }),
      }),
    ]);

  return (
    <>
      {match(state)
        .with("Active", () => (
          <>
            <Button
              hierarchy="danger"
              kind="tonal"
              onPress={() => setIsSuspendDialogOpen(true)}
              size="md"
            >
              Suspend
            </Button>
            {editAction}
          </>
        ))
        .with("Suspended", () => (
          <>
            <Button
              hierarchy="danger"
              kind="tonal"
              onPress={() => setIsArchiveDialogOpen(true)}
              size="md"
            >
              Archive
            </Button>
            {editAction}
            <ReactivationButton
              eserviceId={eserviceId}
              onReactivationSuccess={invalidateEserviceQueries}
            />
          </>
        ))
        .with("Archived", () => null)
        .exhaustive()}

      <ArchiveModal
        eserviceId={eserviceId}
        isOpen={isArchiveDialogOpen}
        onArchiveSuccess={() => {
          setIsArchiveDialogOpen(false);
          void invalidateEserviceQueries();
        }}
        onOpenChange={setIsArchiveDialogOpen}
      />

      <SuspensionModal
        eserviceId={eserviceId}
        isOpen={isSuspendDialogOpen}
        onOpenChange={setIsSuspendDialogOpen}
        onSuspensionSuccess={() => {
          setIsSuspendDialogOpen(false);
          void invalidateEserviceQueries();
        }}
      />
    </>
  );
}

function ArchiveModal({
  eserviceId,
  isOpen,
  onArchiveSuccess,
  onOpenChange,
}: {
  eserviceId: string;
  isOpen: boolean;
  onArchiveSuccess: () => void;
  onOpenChange: (isOpen: boolean) => void;
}) {
  const {
    isError: isArchiveError,
    isPending: isArchiving,
    mutate: archive,
  } = useMutation({
    ...archiveProducerEserviceMutation({ client }),
    onSuccess: onArchiveSuccess,
  });

  return (
    <Modal
      actionLabel="Archive anyway"
      cancelLabel="Cancel"
      confirmButtonProps={{ isPending: isArchiving }}
      description="Are you sure you want to archive this E-Service? Linked Agreements and Purposes will remain in their current state but will no longer be usable to obtain access tokens. This action cannot be undone."
      isDismissable
      isOpen={isOpen}
      kind="destructive"
      onConfirm={() => archive({ path: { eserviceId } })}
      onOpenChange={onOpenChange}
      showErrorBanner={isArchiveError}
      title="Archive E-Service"
    />
  );
}

function ReactivationButton({
  eserviceId,
  onReactivationSuccess,
}: {
  eserviceId: string;
  onReactivationSuccess: () => void;
}) {
  const { isPending: isReactivating, mutate: reactivate } = useMutation({
    ...reactivateEserviceMutation({ client }),
    onError: () =>
      toastQueue.add({
        description: "Please try again later.",
        kind: "error",
        title: "Unable to reactivate E-Service",
      }),
    onSuccess: onReactivationSuccess,
  });
  return (
    <Button
      hierarchy="brand"
      isPending={isReactivating}
      kind="filled"
      onPress={() => reactivate({ path: { eserviceId } })}
      size="md"
    >
      Reactivate
    </Button>
  );
}

function SuspensionModal({
  eserviceId,
  isOpen,
  onOpenChange,
  onSuspensionSuccess,
}: {
  eserviceId: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuspensionSuccess: () => void;
}) {
  const {
    isError: isSuspendError,
    isPending: isSuspending,
    mutate: suspend,
  } = useMutation({
    ...suspendEserviceMutation({ client }),
    onSuccess: onSuspensionSuccess,
  });

  return (
    <Modal
      actionLabel="Suspend anyway"
      cancelLabel="Cancel"
      confirmButtonProps={{ isPending: isSuspending }}
      description="Suspending an E-Service causes malfunctioning in all the services that use it. Are you sure you want to suspend this E-Service? You will be able to reactivate it later."
      isDismissable
      isOpen={isOpen}
      kind="destructive"
      onConfirm={() => suspend({ path: { eserviceId } })}
      onOpenChange={onOpenChange}
      showErrorBanner={isSuspendError}
      title="Suspend E-Service"
    />
  );
}
