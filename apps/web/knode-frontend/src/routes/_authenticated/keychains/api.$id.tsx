import {
  type KnodeApiKeychainId,
  unsafeBrandId,
} from "@knodia/common-models/ids";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";

import { KeychainDetailPage } from "@/features/keychain/components/KeychainDetailPage";
import {
  knodeApiKeychainDetailsSearchDefaultValues,
  knodeApiKeychainDetailsSearchSchema,
} from "@/features/keychain/models/search-params";
import { knodeApiKeychainDetailsQuery } from "@/features/keychain/services/queries";

export const Route = createFileRoute("/_authenticated/keychains/api/$id")({
  component: RouteComponent,
  loader: ({ context: { queryClient }, params: { id } }) =>
    queryClient.ensureQueryData(
      knodeApiKeychainDetailsQuery(unsafeBrandId<KnodeApiKeychainId>(id)),
    ),
  search: {
    middlewares: [
      stripSearchParams(knodeApiKeychainDetailsSearchDefaultValues),
    ],
  },
  validateSearch: knodeApiKeychainDetailsSearchSchema,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const keychainId = unsafeBrandId<KnodeApiKeychainId>(id);
  const { offset, tab } = Route.useSearch();
  const navigate = Route.useNavigate();

  const { data: knodeApiKeychain } = useSuspenseQuery(
    knodeApiKeychainDetailsQuery(keychainId),
  );

  return (
    <KeychainDetailPage
      activeTab={tab}
      keychain={knodeApiKeychain}
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
      type="api"
    />
  );
}
