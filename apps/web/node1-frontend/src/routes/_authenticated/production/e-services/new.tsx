import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { CreateEServiceModal } from "@/features/e-service/components/CreateEServiceModal";
import { requireRole } from "@/libs/routeGuards";

export const Route = createFileRoute(
  "/_authenticated/production/e-services/new",
)({
  component: RouteComponent,
  loader: ({ context }) => {
    requireRole(context, "technical");
  },
});

function RouteComponent() {
  const navigate = useNavigate();
  const onClose = () =>
    navigate({ replace: true, to: "/production/e-services" });

  return <CreateEServiceModal onClose={onClose} />;
}
