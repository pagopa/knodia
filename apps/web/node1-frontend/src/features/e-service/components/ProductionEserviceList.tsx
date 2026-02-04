import { ProductionEserviceCard } from "./EserviceCard";

export function ProductionEserviceList() {
  return (
    <ul className="flex flex-col gap-4" role="list">
      {Array.from({ length: 5 }).map((_, index) => (
        <li key={index}>
          <ProductionEserviceCard />
        </li>
      ))}
    </ul>
  );
}
