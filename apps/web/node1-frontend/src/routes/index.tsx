import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { eserviceQueries } from "@/features/e-service/api/queries";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { data } = useQuery(
    eserviceQueries.getEServices({ limit: 10, offset: 0 }),
  );

  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}
