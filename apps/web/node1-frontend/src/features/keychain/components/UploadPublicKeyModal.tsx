import type { bffApi } from "@knodia/bff-client";

import {
  getConsumerKeychainKeysQueryKey,
  uploadConsumerKeychainKeyMutation,
} from "@knodia/bff-client/tanstack-query";
import { Banner, Modal, TextArea, TextField } from "@knodia/ui-kit/ui";
import { revalidateLogic, useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { match } from "ts-pattern";

import { client } from "@/libs/axios";
import { getFieldErrorMessage } from "@/utils/getFieldErrorMessage";

import type { KeychainType } from "../models/commons";

import {
  publicKeyUploadFormDefaultValues,
  publicKeyUploadFormSchema,
  type PublicKeyUploadFormValues,
} from "../models/keychain-forms";

interface Props {
  hasReachedMaxKeys: boolean;
  isKeychainMember: boolean;
  isOpen: boolean;
  keychainId: string;
  onClose: () => void;
  type: KeychainType;
}

export function UploadPublicKeyModal({
  hasReachedMaxKeys,
  isKeychainMember,
  isOpen,
  keychainId,
  onClose,
  type,
}: Props) {
  const queryClient = useQueryClient();

  function handleClose() {
    form.reset();
    onClose();
  }

  const {
    isError,
    isPending,
    mutate: uploadConsumerKeychainKey,
  } = useMutation({
    ...uploadConsumerKeychainKeyMutation({
      client,
    }),
  });

  function handleUploadKey(seed: PublicKeyUploadFormValues) {
    const body: bffApi.UploadConsumerKeychainKeyData["body"] = {
      encodedPem: btoa(seed.pem),
      name: { en: seed.name },
    };

    match(type)
      .with("consumption", () =>
        uploadConsumerKeychainKey(
          {
            body,
            path: { consumerKeychainId: keychainId },
          },
          {
            onSuccess() {
              queryClient.invalidateQueries({
                queryKey: getConsumerKeychainKeysQueryKey({
                  client,
                  path: { consumerKeychainId: keychainId },
                  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                  query: undefined!,
                }),
              });
              handleClose();
            },
          },
        ),
      )
      .with("production", () => {
        throw new Error("Producer keychains are not supported yet.");
      })
      .with("api", () => {
        throw new Error("API keychains are not supported yet.");
      })
      .exhaustive();
  }

  const form = useForm({
    defaultValues: publicKeyUploadFormDefaultValues,
    onSubmit: async ({ value }) => {
      handleUploadKey(value);
    },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: publicKeyUploadFormSchema,
    },
  });

  const modalTitle = "Upload public key";
  const modalDescription =
    "To sign your private key, upload the matching public key.";

  if (!isKeychainMember) {
    return (
      <Modal
        description={modalDescription}
        isOpen={isOpen}
        onOpenChange={handleClose}
        title={modalTitle}
      >
        <Banner
          kind="informative"
          size="md"
          title="You are not a member of this keychain"
        >
          Only Keychain members can upload public keys.
        </Banner>
      </Modal>
    );
  }

  if (hasReachedMaxKeys) {
    return (
      <Modal
        description={modalDescription}
        isOpen={isOpen}
        onOpenChange={handleClose}
        title={modalTitle}
      >
        <Banner kind="warning" size="md" title="Maximum number of keys reached">
          You have reached the maximum number of keys allowed for a Keychain.
          Delete a key to upload a new one.
        </Banner>
      </Modal>
    );
  }

  return (
    <Modal
      actionLabel="Upload"
      cancelLabel="Cancel"
      confirmButtonProps={{ isPending }}
      description={modalDescription}
      isOpen={isOpen}
      kind="default"
      onConfirm={() => void form.handleSubmit()}
      onOpenChange={(open) => {
        if (!open) {
          handleClose();
        }
      }}
      showErrorBanner={isError}
      title={modalTitle}
    >
      <form
        className="flex flex-col gap-6"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <form.Field name="name">
          {(field) => (
            <TextField
              description="Min 5 characters, max 60 characters"
              errorMessage={getFieldErrorMessage(field.state.meta.errors)}
              isInvalid={
                field.state.meta.isTouched && !field.state.meta.isValid
              }
              isRequired
              label="Name"
              name={field.name}
              onBlur={field.handleBlur}
              onChange={field.handleChange}
              value={field.state.value}
            />
          )}
        </form.Field>

        <form.Field name="pem">
          {(field) => (
            <TextArea
              errorMessage={getFieldErrorMessage(field.state.meta.errors)}
              isInvalid={
                field.state.meta.isTouched && !field.state.meta.isValid
              }
              label="Public Key (PEM format)"
              name={field.name}
              onBlur={field.handleBlur}
              onChange={field.handleChange}
              value={field.state.value}
            />
          )}
        </form.Field>
      </form>
    </Modal>
  );
}
