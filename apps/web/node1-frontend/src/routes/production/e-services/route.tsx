import { Button } from "@knodia/ui-kit/ui";
import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/production/e-services")({
  component: EServicesLayout,
});

function EServicesLayout() {
  const navigate = useNavigate();
  const onCreateEservicePress = () => {
    navigate({ to: "/production/e-services/new" });
  };
  return (
    <div>
      <Button
        className="absolute top-4 right-4"
        onPress={onCreateEservicePress}
      >
        Create E-service
      </Button>
      Hello "/production/e-services"!
      <Outlet />
    </div>
  );
}
