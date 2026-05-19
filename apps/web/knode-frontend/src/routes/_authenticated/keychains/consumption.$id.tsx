import {
  type ConsumerKeychainId,
  unsafeBrandId,
} from "@knodia/common-models/ids";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";

import { KeychainDetailPage } from "@/features/keychain/components/KeychainDetailPage";
import {
  consumerKeychainDetailsSearchDefaultValues,
  consumerKeychainDetailsSearchSchema,
} from "@/features/keychain/models/search-params";
import { consumerKeychainDetailsQuery } from "@/features/keychain/services/queries";

export const Route = createFileRoute(
  "/_authenticated/keychains/consumption/$id",
)({
  component: RouteComponent,
  loader: ({ context: { queryClient }, params: { id } }) =>
    queryClient.ensureQueryData(
      consumerKeychainDetailsQuery(unsafeBrandId<ConsumerKeychainId>(id)),
    ),
  search: {
    middlewares: [
      stripSearchParams(consumerKeychainDetailsSearchDefaultValues),
    ],
  },
  validateSearch: consumerKeychainDetailsSearchSchema,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const keychainId = unsafeBrandId<ConsumerKeychainId>(id);
  const { offset, tab } = Route.useSearch();
  const navigate = Route.useNavigate();

  const { data: consumerKeychain } = useSuspenseQuery(
    consumerKeychainDetailsQuery(keychainId),
  );

  return (
    <KeychainDetailPage
      activeTab={tab}
      keychain={consumerKeychain}
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
      type="consumption"
    />
  );
}
