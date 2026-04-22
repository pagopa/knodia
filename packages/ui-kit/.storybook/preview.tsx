import { type Preview } from "@storybook/react-vite";
import { useEffect } from "react";

import lynxHref from "../src/themes/lynx.css?url";
import orionHref from "../src/themes/orion.css?url";

const THEME_LINK_ID = "knodia-theme-css";
const THEMES = {
  orion: { href: orionHref, title: "Orion" },
  lynx: { href: lynxHref, title: "Lynx" },
} as const;
type ThemeName = keyof typeof THEMES;
const DEFAULT_THEME: ThemeName = "orion";

function getOrCreateThemeLink(): HTMLLinkElement {
  const existing = document.getElementById(THEME_LINK_ID);
  if (existing instanceof HTMLLinkElement) return existing;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.id = THEME_LINK_ID;
  document.head.appendChild(link);
  return link;
}

function resolveTheme(value: unknown): ThemeName {
  return value === "orion" || value === "lynx" ? value : DEFAULT_THEME;
}

if (typeof document !== "undefined") {
  getOrCreateThemeLink().href = THEMES[DEFAULT_THEME].href;
}

const preview: Preview = {
  globalTypes: {
    theme: {
      description: "Knode theme",
      toolbar: {
        title: "Theme",
        icon: "paintbrush",
        dynamicTitle: true,
        items: Object.entries(THEMES).map(([value, { title }]) => ({
          value,
          title,
        })),
      },
    },
  },
  initialGlobals: { theme: DEFAULT_THEME },
  decorators: [
    (Story, context) => {
      const theme = resolveTheme(context.globals["theme"]);
      useEffect(() => {
        getOrCreateThemeLink().href = THEMES[theme].href;
      }, [theme]);
      return <Story />;
    },
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
