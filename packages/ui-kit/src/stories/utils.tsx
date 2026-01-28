import type { StoryFn } from "@storybook/react-vite";

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
