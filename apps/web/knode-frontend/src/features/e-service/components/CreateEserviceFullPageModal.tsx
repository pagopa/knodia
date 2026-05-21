import { FullPageModal } from "@/layouts/FullPageModal";

export function CreateEserviceFullPageModal({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <>
      <FullPageModal onClose={onClose} title="Create E-Service">
        {children}
      </FullPageModal>
    </>
  );
}
