import type { HTMLAttributes } from "react";

import { tv, type VariantProps } from "tailwind-variants";

const avatar = tv({
  base: "bg-brand-100 text-primary-light-high-contrast inline-flex items-center justify-center overflow-hidden rounded-full select-none",
  variants: {
    size: {
      sm: "label-sm size-6",
      md: "label-md size-10",
      lg: "label-lg size-14",
    },
  },
  defaultVariants: { size: "md" },
});

export interface AvatarProps
  extends AvatarVariants, HTMLAttributes<HTMLSpanElement> {
  fallback?: string;
  image?: {
    alt?: string;
    src: string;
  };
}

type AvatarVariants = VariantProps<typeof avatar>;

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
        <span>{fallback}</span>
      )}
    </span>
  );
}
