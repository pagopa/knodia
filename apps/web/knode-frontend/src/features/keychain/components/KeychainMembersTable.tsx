import type { bffApi } from "@knodia/bff-client";

import {
  type ConsumerKeychainId,
  type KnodeApiKeychainId,
  unsafeBrandUserId,
  type UserId,
} from "@knodia/common-models/ids";
import {
  Banner,
  Button,
  Cell,
  Column,
  Loader,
  Modal,
  Row,
  Table,
  TableBody,
  TableHeader,
} from "@knodia/ui-kit/ui";
import { MinusSquareIcon, SelectionPlusIcon } from "@phosphor-icons/react";
import { DialogTrigger } from "react-aria-components";

import { useHasRole } from "@/contexts/auth";

import type { SupportedKeychainType } from "../models/commons";

import { useRemoveKeychainMember } from "../hooks/useKeychainMutations";

interface KeychainMembersTableProps {
  isLoading: boolean;
  keychainId: ConsumerKeychainId | KnodeApiKeychainId;
  members: bffApi.User[];
  type: SupportedKeychainType;
}

export function KeychainMembersTable({
  isLoading,
  keychainId,
  members,
  type,
}: KeychainMembersTableProps) {
  const isAdmin = useHasRole("administrative");

  if (isLoading) {
    return <Loader className="mx-auto mt-20" label="Loading..." />;
  }

  if (members.length === 0) {
    return (
      <Banner icon={<SelectionPlusIcon />} kind="neutral">
        There are no members in this Keychain. Add the first one.
      </Banner>
    );
  }

  return (
    <Table aria-label="Keychains table">
      <TableHeader>
        <Column id="name" isRowHeader>
          Name
        </Column>
        <Column id="email">Email</Column>
        {isAdmin && (
          <Column id="actions">
            <span className="sr-only">Actions</span>
          </Column>
        )}
      </TableHeader>
      <TableBody items={members}>
        {(member) => (
          <Row id={member.id}>
            <Cell>
              <span className="body-md-em">{member.username}</span>
            </Cell>
            <Cell className="body-md-em">{member.email}</Cell>
            {isAdmin && (
              <Cell>
                <div className="flex justify-end">
                  <RemoveFromKeychainAction
                    keychainId={keychainId}
                    type={type}
                    userId={unsafeBrandUserId(member.id)}
                  />
                </div>
              </Cell>
            )}
          </Row>
        )}
      </TableBody>
    </Table>
  );
}

function RemoveFromKeychainAction({
  keychainId,
  type,
  userId,
}: {
  keychainId: ConsumerKeychainId | KnodeApiKeychainId;
  type: SupportedKeychainType;
  userId: UserId;
}) {
  const { isError, isPending, mutate } = useRemoveKeychainMember(
    keychainId,
    type,
  );

  function handleDelete() {
    mutate(userId);
  }

  return (
    <DialogTrigger>
      <Button hierarchy="danger" kind="outlined" size="sm">
        <MinusSquareIcon />
        Remove from Keychain
      </Button>
      <Modal
        actionLabel="Remove anyway"
        cancelLabel="Cancel"
        confirmButtonProps={{ isPending }}
        description="Are you sure you want to remove this member from the Keychain? They will no longer be able to upload public keys."
        isDismissable
        kind="destructive"
        onConfirm={handleDelete}
        showErrorBanner={isError}
        title="Remove Member"
      >
        <Banner
          kind="warning"
          title="Removed members can still use their public keys"
        >
          We don&apos;t automatically delete the keys to prevent interruptions,
          but we recommend replacing all keys associated with removed members.
        </Banner>
      </Modal>
    </DialogTrigger>
  );
}
