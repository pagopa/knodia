import { Banner, Modal, TextArea, TextField } from "@knodia/ui-kit/ui";
import { revalidateLogic, useForm } from "@tanstack/react-form";

import { getFieldErrorMessage } from "@/utils/getFieldErrorMessage";

import type { SupportedKeychain } from "../models/commons";

import { useUploadKeychainKey } from "../hooks/useKeychainMutations";
import {
  publicKeyUploadFormDefaultValues,
  publicKeyUploadFormSchema,
  type PublicKeyUploadFormValues,
} from "../models/keychain-forms";

interface Props {
  hasReachedMaxKeys: boolean;
  isKeychainMember: boolean;
  isOpen: boolean;
  keychain: SupportedKeychain;
  onClose: () => void;
}

interface UploadPublicKeyFormProps {
  keychain: SupportedKeychain;
  onClose: () => void;
}

const modalTitle = "Upload public key";
const modalDescription =
  "To sign with your private key, upload the matching public key.";

export function UploadPublicKeyModal({
  hasReachedMaxKeys,
  isKeychainMember,
  isOpen,
  keychain,
  onClose,
}: Props) {
  if (!isKeychainMember) {
    return (
      <Modal
        description={modalDescription}
        isOpen={isOpen}
        onOpenChange={onClose}
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
        onOpenChange={onClose}
        title={modalTitle}
      >
        <Banner kind="warning" size="md" title="Maximum number of keys reached">
          You have reached the maximum number of keys allowed for a Keychain.
          Delete a key to upload a new one.
        </Banner>
      </Modal>
    );
  }

  return isOpen ? (
    <UploadPublicKeyForm keychain={keychain} onClose={onClose} />
  ) : null;
}

function UploadPublicKeyForm({ keychain, onClose }: UploadPublicKeyFormProps) {
  const { isError, isPending, mutate } = useUploadKeychainKey(keychain);

  function handleUploadKey(seed: PublicKeyUploadFormValues) {
    mutate(
      { encodedPem: btoa(seed.pem), name: { en: seed.name.trim() } },
      { onSuccess: onClose },
    );
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

  return (
    <Modal
      actionLabel="Upload"
      cancelLabel="Cancel"
      confirmButtonProps={{ isPending }}
      description={modalDescription}
      isOpen
      kind="default"
      onConfirm={() => void form.handleSubmit()}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
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
