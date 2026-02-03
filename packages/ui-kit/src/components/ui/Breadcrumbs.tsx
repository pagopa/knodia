import { CaretRightIcon } from "@phosphor-icons/react";
import {
  Breadcrumb as AriaBreadcrumb,
  Breadcrumbs as AriaBreadcrumbs,
  type BreadcrumbProps,
  type BreadcrumbsProps,
  type LinkProps,
} from "react-aria-components";
import { twMerge } from "tailwind-merge";

import { composeTailwindRenderProps } from "../../libs/react-aria";
import { Link } from "./Link";

export function Breadcrumb(
  props: BreadcrumbProps & Omit<LinkProps, "className">,
) {
  return (
    <AriaBreadcrumb
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        "flex items-center gap-4",
      )}
    >
      {({ isCurrent }) => (
        <>
          <Link variant="secondary" {...props} />
          {!isCurrent && (
            <CaretRightIcon
              className="text-primary-light-low-contrast size-4"
              weight="bold"
            />
          )}
        </>
      )}
    </AriaBreadcrumb>
  );
}

export function Breadcrumbs<T extends object>(props: BreadcrumbsProps<T>) {
  return (
    <AriaBreadcrumbs
      {...props}
      className={twMerge("flex gap-4", props.className)}
    />
  );
}
