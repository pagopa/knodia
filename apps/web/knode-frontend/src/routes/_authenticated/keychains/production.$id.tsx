import {
  type ProducerKeychainId,
  unsafeBrandId,
} from "@knodia/common-models/ids";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";

import { KeychainDetailPage } from "@/features/keychain/components/KeychainDetailPage";
import {
  producerKeychainDetailsSearchDefaultValues,
  producerKeychainDetailsSearchSchema,
} from "@/features/keychain/models/search-params";
import { producerKeychainDetailsQuery } from "@/features/keychain/services/queries";

export const Route = createFileRoute(
  "/_authenticated/keychains/production/$id",
)({
  component: RouteComponent,
  loader: ({ context: { queryClient }, params: { id } }) =>
    queryClient.ensureQueryData(
      producerKeychainDetailsQuery(unsafeBrandId<ProducerKeychainId>(id)),
    ),
  search: {
    middlewares: [
      stripSearchParams(producerKeychainDetailsSearchDefaultValues),
    ],
  },
  validateSearch: producerKeychainDetailsSearchSchema,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const keychainId = unsafeBrandId<ProducerKeychainId>(id);
  const { offset, tab } = Route.useSearch();
  const navigate = Route.useNavigate();

  const { data: producerKeychain } = useSuspenseQuery(
    producerKeychainDetailsQuery(keychainId),
  );

  return (
    <KeychainDetailPage
      activeTab={tab}
      keychain={producerKeychain}
      keychainId={keychainId}
      offset={offset}
      onOffsetChange={(offset) =>
        navigate({ replace: true, search: (s) => ({ ...s, offset }) })
      }
      onTabChange={(tab) =>
        navigate({
          replace: true,
          search: (s) => ({ ...s, offset: 0, tab }),
        })
      }
      type="production"
    />
  );
}
