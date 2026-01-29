import { Link } from "@knodia/ui-kit/ui";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/production/e-services/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      <Link
        className="absolute top-4 right-4"
        href="/production/e-services/new"
      >
        Create E-service
      </Link>
      Hello "/production/e-services"!
    </div>
  );
}
