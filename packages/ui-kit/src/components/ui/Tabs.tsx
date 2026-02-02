import { createContext, useContext } from "react";
import {
  composeRenderProps,
  Tab as RACTab,
  TabList as RACTabList,
  type TabListProps as RACTabListProps,
  TabPanel as RACTabPanel,
  type TabPanelProps as RACTabPanelProps,
  type TabProps as RACTabProps,
  Tabs as RACTabs,
  type TabsProps as RACTabsProps,
} from "react-aria-components";
import { tv, type VariantProps } from "tailwind-variants";

import { focusRing } from "./styles";

type TabsKind = "fill" | "hug";

const TabsKindContext = createContext<null | TabsKind>(null);

function useTabsKind(kind?: TabsKind): TabsKind {
  const context = useContext(TabsKindContext);
  return kind ?? context ?? "hug";
}

const tabList = tv({
  base: "relative flex items-end gap-2 border-b border-primary-light-decorative px-6",
  variants: {
    kind: {
      hug: "",
      fill: "w-full",
    },
  },
  defaultVariants: {
    kind: "hug",
  },
});

const tab = tv({
  extend: focusRing,
  base: "body-md box-border inline-flex items-center justify-center gap-2 rounded-t-md border border-transparent px-6 py-1.75 text-center text-primary-light-high-contrast transition [-webkit-tap-highlight-color:transparent]",
  variants: {
    kind: {
      hug: "shrink-0",
      fill: "flex-1 min-w-0",
    },
    isSelected: {
      true: "body-md-em bg-white border-primary-light-decorative border-b-transparent relative z-10 -mb-px",
      false: "bg-neutral-100 border-primary-light-decorative border-b-0",
    },
    isDisabled: {
      true: "cursor-not-allowed opacity-30",
    },
  },
  compoundVariants: [
    {
      isSelected: false,
      class: "hover:bg-neutral-200 pressed:bg-neutral-200",
    },
    {
      isSelected: true,
      class: "hover:bg-white pressed:bg-white",
    },
  ],
});

export interface TabListProps<T extends object = object>
  extends RACTabListProps<T>, TabListVariants {}

export type TabPanelProps = RACTabPanelProps;
export interface TabProps extends RACTabProps, TabVariants {}

export interface TabsProps extends RACTabsProps {
  kind?: TabsKind;
}
type TabListVariants = VariantProps<typeof tabList>;

type TabVariants = Omit<VariantProps<typeof tab>, "isSelected">;

export function Tab({ kind, ...props }: TabProps) {
  const resolvedKind = useTabsKind(kind);

  return (
    <RACTab
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) =>
        tab({
          ...renderProps,
          className,
          kind: resolvedKind,
        }),
      )}
    />
  );
}

export function TabList<T extends object = object>({
  kind,
  ...props
}: TabListProps<T>) {
  const resolvedKind = useTabsKind(kind);

  return (
    <RACTabList<T>
      {...props}
      className={composeRenderProps(props.className, (className) =>
        tabList({ className, kind: resolvedKind }),
      )}
    />
  );
}

export function TabPanel(props: TabPanelProps) {
  return <RACTabPanel {...props} />;
}

export function Tabs({ kind = "hug", ...props }: TabsProps) {
  return (
    <TabsKindContext.Provider value={kind}>
      <RACTabs {...props} />
    </TabsKindContext.Provider>
  );
}
