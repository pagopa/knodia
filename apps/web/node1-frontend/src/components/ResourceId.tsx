import { twMerge } from "tailwind-merge";

interface ResourceIdProps extends React.ComponentProps<"div"> {
  id: string;
}

export function ResourceId({ className, id, ...props }: ResourceIdProps) {
  return (
    <div className={twMerge(className)} {...props}>
      <dl className="body-md flex items-center gap-2 text-primary-light-high-contrast">
        <dt className="body-md-em">ID</dt>
        <dd className="body-md">{id}</dd>
      </dl>
      <CopyButton />
    </div>
  );
}

function CopyButton() {
  return null;
}
