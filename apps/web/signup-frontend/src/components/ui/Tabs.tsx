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
  base: "flex border-b border-neutral-surface-gray",
  defaultVariants: {
    kind: "fill",
  },
  variants: {
    kind: {
      fill: "w-full",
      hug: "w-fit",
    },
  },
});

const tab = tv({
  base: "text-style-small box-border inline-flex min-h-12 items-center justify-center border-b-2 border-transparent px-6 text-center text-neutral-graphite transition [-webkit-tap-highlight-color:transparent]",
  compoundVariants: [
    {
      class: "hover:text-primary-violet",
      isSelected: false,
    },
    {
      class: "text-primary-violet",
      isSelected: true,
    },
  ],
  extend: focusRing,
  variants: {
    isDisabled: {
      true: "cursor-not-allowed opacity-30",
    },
    isSelected: {
      false: "",
      true: "border-primary-violet",
    },
    kind: {
      fill: "min-w-0 flex-1",
      hug: "shrink-0",
    },
  },
});

const tabPanel = tv({
  base: "outline-primary-violet outline-offset-2",
  variants: {
    isFocusVisible: {
      false: "outline-0",
      true: "outline-2",
    },
  },
});

interface TabListProps<T extends object = object>
  extends RACTabListProps<T>, TabListVariants {}

type TabListVariants = VariantProps<typeof tabList>;
type TabPanelProps = RACTabPanelProps;

interface TabProps extends RACTabProps, TabVariants {}
interface TabsProps extends RACTabsProps {
  kind?: TabsKind;
}

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
  return (
    <RACTabPanel
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) =>
        tabPanel({ ...renderProps, className }),
      )}
    />
  );
}

export function Tabs({ kind = "hug", ...props }: TabsProps) {
  return (
    <TabsKindContext.Provider value={kind}>
      <RACTabs {...props} />
    </TabsKindContext.Provider>
  );
}
