import { Button } from "@knodia/ui-kit/ui";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { CreateEServiceModal } from "@/features/e-service/components/CreateEServiceModal/CreateEServiceModal";

export const Route = createFileRoute("/production/e-services")({
  component: EServicesLayout,
});

function EServicesLayout() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div>
      <Button
        className="absolute top-4 right-4"
        onPress={() => setIsModalOpen(true)}
      >
        Create E-service
      </Button>
      Hello "/production/e-services"!
      {isModalOpen && (
        <CreateEServiceModal onClose={() => setIsModalOpen(false)} />
      )}
    </div>
  );
}
