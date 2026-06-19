import { tv } from "tailwind-variants";

const cardStyles = tv({
  base: "rounded-card bg-neutral-white px-10 py-[33px] shadow-card",
});

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

/** @knipignore — scaffolded in KN-739, wired up by the next signup screens */
export function Card({ children, className }: CardProps) {
  return <div className={cardStyles({ className })}>{children}</div>;
}
