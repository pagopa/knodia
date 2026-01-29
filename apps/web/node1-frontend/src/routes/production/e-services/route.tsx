import { Link } from "@knodia/ui-kit/ui";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/production/e-services")({
  component: EServicesLayout,
});

function EServicesLayout() {
  return (
    <div>
      <Link
        className="absolute top-4 right-4"
        href="/production/e-services/new"
      >
        Create E-service
      </Link>
      Hello "/production/e-services"!
      <Outlet />
    </div>
  );
}
