import { twMerge } from "tailwind-merge";

interface GenericInfoCardProps extends React.ComponentProps<"dl"> {
  children: React.ReactNode;
  label: string;
}

export function GenericInfoCard({
  children,
  className,
  label,
  ...props
}: GenericInfoCardProps) {
  return (
    <dl
      {...props}
      className={twMerge(
        "flex justify-between py-3 px-4 rounded-lg text-primary-dark bg-secondary-light",
        className,
      )}
    >
      <dt className="text-primary-light-low-contrast body-md">{label}</dt>
      <dd className="body-md-em">{children}</dd>
    </dl>
  );
}
