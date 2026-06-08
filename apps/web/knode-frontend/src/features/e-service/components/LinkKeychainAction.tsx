import type { bffApi } from "@knodia/bff-client";

import {
  type EserviceId,
  type ProducerKeychainId,
  unsafeBrandId,
} from "@knodia/common-models/ids";
import { Banner, Button, Modal, Select, SelectItem } from "@knodia/ui-kit/ui";
import { InfoIcon } from "@phosphor-icons/react";
import { revalidateLogic, useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import z from "zod";

import { producerKeychainOptionsQuery } from "@/features/keychain/services/queries";
import { getFieldErrorMessage } from "@/utils/getFieldErrorMessage";

import { useLinkKeychainToEservice } from "../hooks/useEserviceKeychainMutations";

export function LinkKeychainAction({
  eserviceId,
  linkedKeychainIds,
}: {
  eserviceId: EserviceId;
  linkedKeychainIds: string[];
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        hierarchy="neutral"
        kind="tonal"
        onClick={() => setIsOpen(true)}
        size="sm"
      >
        Link Keychain
      </Button>
      {isOpen && (
        <LinkKeychainModal
          eserviceId={eserviceId}
          linkedKeychainIds={linkedKeychainIds}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

function LinkKeychainForm({
  eserviceId,
  keychains,
  linkedKeychainIds,
  onClose,
}: {
  eserviceId: EserviceId;
  keychains: bffApi.Keychain[];
  linkedKeychainIds: string[];
  onClose: () => void;
}) {
  const { isError, isPending, mutate } = useLinkKeychainToEservice(eserviceId);
  const [alreadyLinked, setAlreadyLinked] = useState(false);

  const options = keychains.map((keychain) => ({
    id: keychain.id,
    label: keychain.name.en,
  }));

  const form = useForm({
    defaultValues: {
      producerKeychainId: null as null | string,
    },
    onSubmit: ({ value }) => {
      if (!value.producerKeychainId) return;
      if (linkedKeychainIds.includes(value.producerKeychainId)) {
        setAlreadyLinked(true);
        return;
      }
      mutate(unsafeBrandId<ProducerKeychainId>(value.producerKeychainId), {
        onSuccess: onClose,
      });
    },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: z.object({
        producerKeychainId: z
          .string()
          .nullable()
          .refine((value) => value !== null, "Select a Keychain"),
      }),
    },
  });

  return (
    <Modal
      actionLabel="Link"
      cancelLabel="Cancel"
      confirmButtonProps={{ isPending }}
      description="Keys in linked Keychains can be used to sign responses from the E-Service."
      isOpen
      onConfirm={() => void form.handleSubmit()}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      showErrorBanner={isError}
      title="Link Keychain"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <form.Field name="producerKeychainId">
          {(field) => (
            <Select
              errorMessage={getFieldErrorMessage(field.state.meta.errors)}
              isInvalid={
                field.state.meta.isTouched && !field.state.meta.isValid
              }
              isRequired
              label="Production Keychains"
              name={field.name}
              onBlur={field.handleBlur}
              onChange={(key) => {
                setAlreadyLinked(false);
                field.handleChange((key as string) ?? null);
              }}
              placeholder="Select an option..."
              value={field.state.value}
            >
              {options.map((option) => (
                <SelectItem id={option.id} key={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </Select>
          )}
        </form.Field>
      </form>
      {alreadyLinked && (
        <Banner kind="error">
          This Keychain is already linked to this E-service.
        </Banner>
      )}
    </Modal>
  );
}

function LinkKeychainModal({
  eserviceId,
  linkedKeychainIds,
  onClose,
}: {
  eserviceId: EserviceId;
  linkedKeychainIds: string[];
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery(producerKeychainOptionsQuery());

  const ownedKeychains = data?.results ?? [];
  const hasNoKeychains = !isLoading && ownedKeychains.length === 0;

  if (hasNoKeychains) {
    return (
      <Modal
        actionLabel="Go to Keychains page"
        cancelLabel="Cancel"
        description="Keys in linked Keychains can be used to sign responses from the E-Service."
        isOpen
        onConfirm={() =>
          void navigate({
            search: { offset: 0, type: "production" },
            to: "/keychains",
          })
        }
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
        title="Link Keychain"
      >
        <Banner
          icon={<InfoIcon />}
          kind="informative"
          size="md"
          title="You don't have any Production Keychain yet"
        >
          Create a Production Keychain on the Keychains page to link it to
          E-Services.
        </Banner>
      </Modal>
    );
  }

  return (
    <LinkKeychainForm
      eserviceId={eserviceId}
      keychains={ownedKeychains}
      linkedKeychainIds={linkedKeychainIds}
      onClose={onClose}
    />
  );
}
