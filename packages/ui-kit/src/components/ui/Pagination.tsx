import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import { tv } from "tailwind-variants";

import { Button, type ButtonProps } from "./Button";

type PaginationItem =
  | { key: "left" | "right"; type: "ellipsis" }
  | { type: "page"; value: number };

const pagination = tv({
  base: "flex items-center gap-2 w-fit",
});

export interface PaginationProps {
  className?: string;
  limit: number;
  offset: number;
  onOffsetChange?: (offset: number) => void;
  totalItems: number;
}

interface PaginationButtonProps extends Omit<
  ButtonProps,
  "hierarchy" | "kind" | "size"
> {
  isCurrent?: boolean;
}

export function Pagination(props: PaginationProps) {
  const { className } = props;

  const limit = Math.max(1, Math.floor(props.limit));
  const totalPages = Math.max(1, Math.ceil(props.totalItems / limit));

  const maxOffset = (totalPages - 1) * limit;
  const safeOffset = clamp(Math.floor(props.offset), 0, maxOffset);

  const page = clamp(Math.floor(safeOffset / limit) + 1, 1, totalPages);

  const items = getPaginationItems({
    page,
    totalPages,
  });

  const isFirstPage = page <= 1;
  const isLastPage = page >= totalPages;

  const handlePageChange = (nextPage: number) => {
    const clampedPage = clamp(nextPage, 1, totalPages);
    props.onOffsetChange?.((clampedPage - 1) * limit);
  };

  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Pagination" className={pagination({ className })}>
      <ul className="flex items-center gap-2">
        <li>
          <PaginationButton
            aria-label="Go to previous page"
            isDisabled={isFirstPage}
            onPress={() => handlePageChange(page - 1)}
            type="button"
          >
            <CaretLeftIcon aria-hidden />
            Previous
          </PaginationButton>
        </li>

        {items.map((item) => {
          if (item.type === "ellipsis") {
            return (
              <li aria-hidden="true" key={`ellipsis-${item.key}`}>
                <span className="body-md-em text-primary-light-high-contrast select-none">
                  …
                </span>
              </li>
            );
          }

          const isCurrent = item.value === page;

          return (
            <li key={item.value}>
              <PaginationButton
                aria-current={isCurrent ? "page" : false}
                isCurrent={isCurrent}
                onPress={() => handlePageChange(item.value)}
                type="button"
              >
                {item.value}
              </PaginationButton>
            </li>
          );
        })}

        <li>
          <PaginationButton
            aria-label="Go to next page"
            isDisabled={isLastPage}
            onPress={() => handlePageChange(page + 1)}
            type="button"
          >
            Next
            <CaretRightIcon aria-hidden />
          </PaginationButton>
        </li>
      </ul>

      <span aria-live="polite" className="sr-only">
        Page {page} of {totalPages}
      </span>
    </nav>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getPaginationItems({
  page,
  totalPages,
}: {
  page: number;
  totalPages: number;
}): PaginationItem[] {
  const innerSlots = 5 - 2;
  const half = Math.floor(innerSlots / 2);

  let start = page - half;
  let end = page + (innerSlots - half - 1);

  if (start < 2) {
    end += 2 - start;
    start = 2;
  }

  if (end > totalPages - 1) {
    start -= end - (totalPages - 1);
    end = totalPages - 1;
  }

  start = Math.max(2, start);
  end = Math.min(totalPages - 1, end);

  const items: PaginationItem[] = [{ type: "page", value: 1 }];

  if (start > 2) {
    items.push({ type: "ellipsis", key: "left" });
  }

  items.push(
    ...range(start, end).map((n) => ({ type: "page", value: n }) as const),
  );

  if (end < totalPages - 1) {
    items.push({ type: "ellipsis", key: "right" });
  }

  items.push({ type: "page", value: totalPages });

  return items;
}

function PaginationButton({ isCurrent, ...props }: PaginationButtonProps) {
  return (
    <Button
      {...props}
      hierarchy="neutral"
      kind={isCurrent ? "outlined" : "ghost"}
      size="md"
    />
  );
}

function range(start: number, end: number): number[] {
  const length = Math.max(0, end - start + 1);
  return Array.from({ length }, (_, index) => start + index);
}
