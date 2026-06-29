import { type VariantProps } from "tailwind-variants";

import { chipStyles } from "./styles";

export interface ChipProps
  extends ChipVariants, Omit<React.ComponentProps<"span">, "children"> {
  icon?: React.ReactNode;
  label: string;
}

type ChipVariants = VariantProps<typeof chipStyles>;

export function Chip({ icon, label, ...props }: ChipProps) {
  return (
    <span
      {...props}
      className={chipStyles({ ...props, className: props.className })}
    >
      {icon}
      <span className="px-1 truncate">{label}</span>
    </span>
  );
}
