interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`rounded-card bg-neutral-white px-10 py-[33px] shadow-card ${className}`}
    >
      {children}
    </div>
  );
}
