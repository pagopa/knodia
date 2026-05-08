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
        <div className="mx-auto max-w-160 p-10 pb-16 flex flex-col gap-16">
          {children}
        </div>
      </FullPageModal>
    </>
  );
}
