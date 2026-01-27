/* eslint-disable react-refresh/only-export-components */
import type { StoryFn } from "@storybook/react-vite";

export function MockIcon() {
  return (
    <svg
      fill="none"
      height="16"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="16"
    >
      <rect height="18" rx="2" ry="2" width="18" x="3" y="3"></rect>
      <line x1="3" x2="21" y1="21" y2="3"></line>
    </svg>
  );
}

export function renderStickerSheet<
  const TVariants extends [unknown, ...unknown[]][],
>(
  variants: TVariants,
  render: (
    ...args: { [K in keyof TVariants]: TVariants[K][number] }
  ) => React.ReactNode,
): NonNullable<StoryFn["render"]> {
  const cartesian = variants.reduce(
    (acc, arr) => acc.flatMap((prev) => arr.map((v) => [...prev, v])),
    [[]] as (readonly unknown[])[],
  );

  return () => (
    <div className="inline-flex flex-wrap gap-8 bg-gray-50 p-8">
      {cartesian.map((combination, index) => (
        <div
          className="flex flex-col gap-2 rounded-lg bg-white p-8 shadow"
          key={index}
        >
          <h3 className="mb-2 text-sm font-semibold tracking-wider text-gray-400 uppercase">
            {combination.join(" / ")}
          </h3>
          <div className="grid grid-cols-3 items-center justify-items-start gap-2">
            {render(
              ...(combination as {
                [K in keyof TVariants]: TVariants[K][number];
              }),
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
