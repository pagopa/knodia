import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { Button } from "@/components/ui/Button";
import { eserviceQueries } from "@/features/e-service/api/queries";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { data } = useQuery(eserviceQueries.getEServices());

  return (
    <div>
      <h1>Home</h1>
      <Button>Test</Button>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
