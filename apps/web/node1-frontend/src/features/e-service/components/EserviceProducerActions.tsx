import type { bffApi } from "@knodia/bff-client";

import {
  getProducerEserviceDetailsQueryKey,
  reactivateProducerEserviceMutation,
  suspendProducerEserviceMutation,
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

  const invalidateEserviceQueries = () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: getProducerEserviceDetailsQueryKey({
          client,
          path: { eserviceId },
        }),
      }),
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey.at(0);
          return (
            typeof key === "object" &&
            key !== null &&
            "_id" in key &&
            key._id === "getProducerEservices"
          );
        },
      }),
    ]);

  const {
    isError: isSuspendError,
    isPending: isSuspending,
    mutate: suspend,
  } = useMutation({
    ...suspendProducerEserviceMutation({ client }),
    onSuccess: () => {
      setIsSuspendDialogOpen(false);
      invalidateEserviceQueries();
    },
  });

  const { isPending: isReactivating, mutate: reactivate } = useMutation({
    ...reactivateProducerEserviceMutation({ client }),
    onError: () =>
      toastQueue.add({
        description: "Please try again later.",
        kind: "error",
        title: "Unable to reactivate E-Service",
      }),
    onSuccess: () => invalidateEserviceQueries(),
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
          showErrorBanner={isSuspendError}
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
