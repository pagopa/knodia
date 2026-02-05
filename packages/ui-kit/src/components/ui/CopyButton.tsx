import { CopyIcon } from "@phosphor-icons/react";
import { useState } from "react";
import {
  Button,
  composeRenderProps,
  TooltipTrigger,
} from "react-aria-components";
import { tv, type VariantProps } from "tailwind-variants";

import { focusRing } from "./styles";
import { Tooltip } from "./Tooltip";

const copyButtonStyles = tv({
  extend: focusRing,
  base: "body-md-em relative inline-flex items-center justify-center rounded-full transition p-2 [&>svg]:size-5 hover:cursor-pointer",
  variants: {
    hierarchy: {
      brand: "text-brand-700 hover:bg-brand-700/10 pressed:bg-brand-700/10",
      danger: "text-error-700 hover:bg-error-700/10 pressed:bg-error-700/10",
      neutral:
        "pressed:bg-neutral-600/10 text-neutral-600 hover:bg-neutral-600/10",
      inverse: "pressed:bg-white/10 text-white hover:bg-white/10",
    },
    isDisabled: {
      true: "cursor-not-allowed opacity-30",
    },
  },
  defaultVariants: {
    hierarchy: "neutral",
  },
});

type CopyButtonProps = CopyButtonVariants &
  Omit<React.ComponentProps<typeof Button>, "children"> & {
    /** Tooltip text shown after copying (defaults to "Copied to clipboard") */
    copiedTooltipText?: string;
    /** The text to copy to clipboard */
    textToCopy: string;
    /** Tooltip text shown before copying (defaults to "Copy") */
    tooltipText?: string;
  };

type CopyButtonVariants = Omit<
  VariantProps<typeof copyButtonStyles>,
  "isDisabled"
>;

export function CopyButton({
  textToCopy,
  tooltipText = "Copy",
  copiedTooltipText = "Copied to clipboard",
  hierarchy,
  ...props
}: CopyButtonProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  return (
    <TooltipTrigger delay={0} isOpen={isCopied}>
      <Button
        {...props}
        className={composeRenderProps(
          props.className,
          (className, renderProps) =>
            copyButtonStyles({
              ...renderProps,
              className,
              hierarchy,
            }),
        )}
        onPress={handleCopy}
      >
        <CopyIcon />
      </Button>
      <Tooltip>{isCopied ? copiedTooltipText : tooltipText}</Tooltip>
    </TooltipTrigger>
  );
}
