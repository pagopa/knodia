import type { HTMLAttributes } from "react";

import { tv } from "tailwind-variants";

export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  fallback?: string;
  image?: {
    alt?: string;
    src: string;
  };
  size?: "lg" | "md" | "sm";
}

const avatar = tv({
  base: "inline-flex items-center justify-center overflow-hidden bg-primary-100 text-primary-light-high-contrast font-medium select-none rounded-full",
  variants: {
    size: {
      sm: "size-6 text-sm",
      md: "size-10",
      lg: "size-14",
    },
  },
  defaultVariants: { size: "md" },
});

export function Avatar({
  image,
  fallback = "?",
  size,
  className,
  ...props
}: AvatarProps) {
  return (
    <span {...props} className={avatar({ size, className })}>
      {image ? (
        <img
          alt={image.alt ?? "avatar"}
          className="h-full w-full object-cover"
          src={image.src}
        />
      ) : (
        <span className="leading-none">{fallback}</span>
      )}
    </span>
  );
}
