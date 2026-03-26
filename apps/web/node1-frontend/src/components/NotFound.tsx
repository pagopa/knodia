import { Empty } from "@knodia/ui-kit/ui";
import { BracketsCurlyIcon } from "@phosphor-icons/react";

export function NotFound() {
  return (
    <Empty
      className="mt-10"
      description="The page you're looking for doesn't exists or has been moved."
      icon={<BracketsCurlyIcon />}
      kind="neutral"
      title="Page not found"
    />
  );
}
