import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_authenticated/consumption/e-services_/$id",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();

  return <p>{id}</p>;
}
