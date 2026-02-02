import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { CreateEServiceModal } from "@/features/e-service/components/CreateEServiceModal/CreateEServiceModal";

export const Route = createFileRoute("/production/e-services/new/")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const onClose = () => navigate({ to: "/production/e-services" });

  return <CreateEServiceModal onClose={onClose} />;
}
