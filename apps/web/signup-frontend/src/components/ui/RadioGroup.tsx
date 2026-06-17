import {
  composeRenderProps,
  Label,
  Radio as RACRadio,
  RadioGroup as RACRadioGroup,
  type RadioGroupProps as RACRadioGroupProps,
  type RadioProps as RACRadioProps,
} from "react-aria-components";
import { tv } from "tailwind-variants";

import { focusRing } from "./styles";

const radioGroupStyles = tv({
  base: "flex w-full flex-col gap-4",
});

interface RadioGroupProps extends RACRadioGroupProps {
  children: React.ReactNode;
  label?: string;
}

/** @knipignore — scaffolded in KN-739, wired up by the next signup screens */
export function RadioGroup({ children, label, ...props }: RadioGroupProps) {
  return (
    <RACRadioGroup
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) =>
        radioGroupStyles({ ...renderProps, className }),
      )}
    >
      {label && (
        <Label className="text-style-body text-neutral-medium-gray">
          {label}
        </Label>
      )}
      <div className="flex w-full flex-col">{children}</div>
    </RACRadioGroup>
  );
}

const radioStyles = tv({
  base: "group flex w-full cursor-pointer items-center",
});

const radioCircleStyles = tv({
  base: "size-6 shrink-0 rounded-full border-2 border-neutral-medium-gray transition-all",
  extend: focusRing,
  variants: {
    isSelected: {
      true: "border-[7px] border-primary-violet",
    },
  },
});

/** @knipignore — scaffolded in KN-739, wired up by the next signup screens */
export function Radio({ children, ...props }: RACRadioProps) {
  return (
    <RACRadio
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) =>
        radioStyles({ ...renderProps, className }),
      )}
    >
      {composeRenderProps(children, (children, renderProps) => (
        <>
          <span className="flex items-center p-[9px]">
            <span aria-hidden className={radioCircleStyles(renderProps)} />
          </span>
          <span className="text-style-small min-w-0 flex-1 text-neutral-medium-gray">
            {children}
          </span>
        </>
      ))}
    </RACRadio>
  );
}
