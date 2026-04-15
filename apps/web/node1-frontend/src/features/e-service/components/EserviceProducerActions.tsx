import type { bffApi } from "@knodia/bff-client";

import {
  getProducerEserviceDetailsQueryKey,
  reactivateEserviceMutation,
  suspendEserviceMutation,
} from "@knodia/bff-client/tanstack-query";
import { Button, Modal, toastQueue } from "@knodia/ui-kit/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { DialogTrigger } from "react-aria-components";
import { match } from "ts-pattern";

import { client } from "@/libs/axios";

interface EserviceProducerActionsProps {
  eserviceId: string;
  state: bffApi.EserviceVersionState;
}

export function EserviceProducerActions({
  eserviceId,
  state,
}: EserviceProducerActionsProps) {
  const queryClient = useQueryClient();
  const [isSuspendDialogOpen, setIsSuspendDialogOpen] = useState(false);

  const invalidateDetails = () =>
    queryClient.invalidateQueries({
      queryKey: getProducerEserviceDetailsQueryKey({
        client,
        path: { eserviceId },
      }),
    });

  const { isPending: isSuspending, mutate: suspend } = useMutation({
    ...suspendEserviceMutation({ client }),
    onError: () =>
      toastQueue.add({
        description: "Please try again later.",
        kind: "error",
        title: "Unable to suspend E-Service",
      }),
    onSuccess: async () => {
      setIsSuspendDialogOpen(false);
      await invalidateDetails();
      toastQueue.add({
        description: "The E-Service is no longer available to consumers.",
        kind: "success",
        title: "E-Service suspended",
      });
    },
  });

  const { isPending: isReactivating, mutate: reactivate } = useMutation({
    ...reactivateEserviceMutation({ client }),
    onError: () =>
      toastQueue.add({
        description: "Please try again later.",
        kind: "error",
        title: "Unable to reactivate E-Service",
      }),
    onSuccess: async () => {
      await invalidateDetails();
      toastQueue.add({
        description: "The E-Service is now available to consumers.",
        kind: "success",
        title: "E-Service reactivated",
      });
    },
  });

  return match(state)
    .with("Active", () => (
      <DialogTrigger
        isOpen={isSuspendDialogOpen}
        onOpenChange={setIsSuspendDialogOpen}
      >
        <Button hierarchy="danger" kind="tonal" size="md">
          Suspend
        </Button>
        <Modal
          actionLabel="Suspend anyway"
          cancelLabel="Cancel"
          confirmButtonProps={{ isPending: isSuspending }}
          description="Suspending an E-Service causes malfunctioning in all the services that use it. Are you sure you want to suspend this E-Service? You will be able to reactivate it later."
          isDismissable
          kind="destructive"
          onConfirm={() => suspend({ path: { eserviceId } })}
          title="Suspend E-Service"
        />
      </DialogTrigger>
    ))
    .with("Suspended", () => (
      <Button
        hierarchy="brand"
        isPending={isReactivating}
        kind="filled"
        onPress={() => reactivate({ path: { eserviceId } })}
        size="md"
      >
        Reactivate
      </Button>
    ))
    .with("Archived", () => null)
    .exhaustive();
}
