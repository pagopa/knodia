import {
  type ProducerKeychainId,
  unsafeBrandId,
} from "@knodia/common-models/ids";
import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute(
  "/_authenticated/keychains/production/$id",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const keychainId = unsafeBrandId<ProducerKeychainId>(id);

  // TODO(KN-672): implement the Producer Keychain detail page.
  return <PageHeader copyableId={keychainId} title="Producer Keychain" />;
}
