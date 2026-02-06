import { twMerge } from "tailwind-merge";

interface CopyableInfoFieldProps extends React.ComponentProps<"div"> {
  id: string;
  label: string;
}

export function CopyableInfoField({
  className,
  id,
  label,
  ...props
}: CopyableInfoFieldProps) {
  return (
    <div className={twMerge(className)} {...props}>
      <dl className="body-md flex items-center gap-2 text-primary-light-high-contrast">
        <dt className="body-md-em">{label}</dt>
        <dd className="body-md">{id}</dd>
      </dl>
      <CopyButton />
    </div>
  );
}

function CopyButton() {
  return null;
}
