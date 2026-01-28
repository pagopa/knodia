import { composeRenderProps } from "react-aria-components";
import { twMerge } from "tailwind-merge";

export function composeTailwindRenderProps<T>(
  className: ((v: T) => string) | string | undefined,
  tw: string,
): ((v: T) => string) | string {
  return composeRenderProps(className, (className) => twMerge(tw, className));
}
