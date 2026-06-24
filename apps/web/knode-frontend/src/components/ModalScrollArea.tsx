import type { ReactNode } from "react";

interface ModalScrollAreaProps {
  children: ReactNode;
  className?: string;
}

// Single source for the documentation modals' scroll height so it can't drift across them.
export function ModalScrollArea({ children, className }: ModalScrollAreaProps) {
  return (
    <div
      className={`flex max-h-[60vh] flex-col overflow-y-auto${className ? ` ${className}` : ""}`}
    >
      {children}
    </div>
  );
}
