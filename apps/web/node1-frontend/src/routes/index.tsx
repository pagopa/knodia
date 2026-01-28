import { Button } from "@knodia/ui-kit/ui";
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

  return (
    <div>
      <h1>Home</h1>
      <Button>Test</Button>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
