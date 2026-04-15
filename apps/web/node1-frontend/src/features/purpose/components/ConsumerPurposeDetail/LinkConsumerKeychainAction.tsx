import type { KnodeId } from "@knodia/common-models/ids";

import {
  getConsumerKeychainOptionsOptions,
  linkPurposeToConsumerKeychainMutation,
} from "@knodia/bff-client/tanstack-query";
import {
  Banner,
  Button,
  ComboBox,
  ComboBoxItem,
  Modal,
} from "@knodia/ui-kit/ui";
import { revalidateLogic, useForm } from "@tanstack/react-form";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useState } from "react";
import z from "zod";

import { useDebouncedValue } from "@/hooks/useDebounceValue";
import { client } from "@/libs/axios";
import { getFieldErrorMessage } from "@/utils/getFieldErrorMessage";

import { purposeLinkedConsumerKeychainsQueryKey } from "../../services/queries";

export function LinkConsumerKeychainAction({
  knodeId,
  purposeId,
}: {
  knodeId: KnodeId;
  purposeId: string;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        hierarchy="neutral"
        kind="tonal"
        onClick={() => setIsModalOpen(true)}
        size="md"
      >
        Link Keychain
      </Button>
      <LinkConsumerKeychainModal
        isOpen={isModalOpen}
        knodeId={knodeId}
        onClose={() => setIsModalOpen(false)}
        purposeId={purposeId}
      />
    </>
  );
}

function LinkConsumerKeychainModal({
  isOpen,
  knodeId,
  onClose,
  purposeId,
}: {
  isOpen: boolean;
  knodeId: KnodeId;
  onClose: () => void;
  purposeId: string;
}) {
  const {
    isError,
    isPending,
    mutate: linkKeychain,
  } = useMutation(linkPurposeToConsumerKeychainMutation({ client }));

  const queryClient = useQueryClient();

  function handleLinkKeychain(keychainId: string) {
    linkKeychain(
      {
        body: { knodeId, purposeId },
        path: { consumerKeychainId: keychainId },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: purposeLinkedConsumerKeychainsQueryKey(),
          });
          form.reset();
          onClose();
        },
      },
    );
  }

  const [q, setQ] = useState("");
  const [debouncedQ] = useDebouncedValue(q, 500);

  const { data } = useQuery({
    ...getConsumerKeychainOptionsOptions({ client, query: { q: debouncedQ } }),
    placeholderData: keepPreviousData,
  });

  const options = data?.results ?? [];

  const form = useForm({
    defaultValues: {
      keychainId: null as null | string,
    },
    onSubmit: async ({ value }) => {
      if (!value.keychainId) return;
      handleLinkKeychain(value.keychainId);
    },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: z.object({
        keychainId: z
          .uuid("Invalid keychain id")
          .nullable()
          .refine((value) => value !== null, "Select a keychain"),
      }),
    },
  });

  return (
    <Modal
      actionLabel="Link"
      cancelLabel="Cancel"
      confirmButtonProps={{ isPending }}
      description="Keys in linked Keychains can be used to request an access token for the E-Service."
      isOpen={isOpen}
      kind="default"
      onConfirm={() => void form.handleSubmit()}
      onOpenChange={(open) => {
        if (!open) {
          form.reset();
          onClose();
        }
      }}
      showErrorBanner={isError}
      title="Link Keychain"
    >
      {data && data.results.length === 0 ? (
        <Banner
          kind="informative"
          size="md"
          title="You don't have any Consumption Keychain yet"
        >
          Create a Production Keychain on the Keychains page to link it to
          E-Services.
        </Banner>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <form.Field
            children={(field) => (
              <ComboBox
                errorMessage={getFieldErrorMessage(field.state.meta.errors)}
                id={field.name}
                isClearable
                isInvalid={field.state.meta.errors.length > 0}
                items={options}
                label="Consumption Keychains"
                name={field.name}
                onBlur={field.handleBlur}
                onInputChange={(input) => setQ(input)}
                onSelectionChange={(key) =>
                  field.handleChange(key as null | string)
                }
                placeholder="Select an option..."
                selectedKey={field.state.value || null}
              >
                {(option) => (
                  <ComboBoxItem id={option.id}>{option.name.en}</ComboBoxItem>
                )}
              </ComboBox>
            )}
            name="keychainId"
          />
        </form>
      )}
    </Modal>
  );
}
