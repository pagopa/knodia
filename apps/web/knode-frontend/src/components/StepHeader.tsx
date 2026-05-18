import type { PropsWithChildren } from "react";

type Props = PropsWithChildren & {
  description?: string;
  title: string;
};
export const StepHeader = ({ children, description, title }: Props) => (
  <div className="flex flex-col gap-3">
    <h2 className="headline-lg-em text-primary-light-high-contrast">{title}</h2>
    {description && (
      <span className="body-md text-primary-dark">{description}</span>
    )}
    {children}
  </div>
);
