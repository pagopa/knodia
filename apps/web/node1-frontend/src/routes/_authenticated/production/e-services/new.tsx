import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { CreateEServiceModal } from "@/features/e-service/components/CreateEServiceModal";

export const Route = createFileRoute(
  "/_authenticated/production/e-services/new",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const onClose = () =>
    navigate({ replace: true, to: "/production/e-services" });

  return <CreateEServiceModal onClose={onClose} />;
}
