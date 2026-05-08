import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { CreateEServiceForm } from "@/features/e-service/components/CreateEServiceForm";
import { CreateEserviceFullPageModal } from "@/features/e-service/components/CreateEserviceFullPageModal";
import { useLeaveConfirmModal } from "@/hooks/useLeaveConfirmModal";
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

  const { modal: leaveConfirmModal, onModalShow: handleShowLeaveConfirm } =
    useLeaveConfirmModal(onClose);

  return (
    <>
      <CreateEserviceFullPageModal onClose={handleShowLeaveConfirm}>
        <CreateEServiceForm onLeave={handleShowLeaveConfirm} />
      </CreateEserviceFullPageModal>
      {leaveConfirmModal}
    </>
  );
}
