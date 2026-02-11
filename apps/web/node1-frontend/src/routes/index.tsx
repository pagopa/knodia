import { getEservicesOptions } from "@knodia/bff-client/tanstack-query";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { client } from "@/libs/axios";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { data } = useQuery(
    getEservicesOptions({ client, query: { limit: 10, offset: 0 } }),
  );

  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}
