import {
  type AccessibilityLang,
  getAccessibilityDocument,
} from "@knodia/accessibility-models";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { AccessibilityRenderer } from "@/components/features/AccessibilityRenderer";
import { Tab, TabList, TabPanel, Tabs } from "@/components/ui";

const LANGUAGES = ["en", "it"] as const satisfies readonly AccessibilityLang[];

const LANGUAGE_LABELS: Record<AccessibilityLang, string> = {
  en: "English version",
  it: "Italian version",
};

export const Route = createFileRoute("/_layout/accessibility")({
  component: RouteComponent,
  // Language lives in the query param so the page stays shareable; the tabs navigate it.
  validateSearch: z.object({
    lang: z.enum(LANGUAGES).default("en").catch("en"),
  }),
});

function RouteComponent() {
  const { lang } = Route.useSearch();
  const navigate = Route.useNavigate();

  return (
    <section className="mx-auto w-full max-w-(--header-shell-max) flex-1 px-(--header-inline-padding) pt-50 pb-28">
      <div className="w-full max-w-201.25">
        <h1 className="mb-14 font-heading text-[56px] leading-16 font-medium tracking-normal text-primary-violet">
          Accessibility
        </h1>
        <Tabs
          kind="fill"
          onSelectionChange={(key) => {
            if (key === "en" || key === "it")
              void navigate({ search: { lang: key } });
          }}
          selectedKey={lang}
        >
          <TabList
            aria-label="Accessibility statement language"
            className="mb-14 w-full max-w-156"
          >
            {LANGUAGES.map((language) => (
              <Tab id={language} key={language}>
                {LANGUAGE_LABELS[language]}
              </Tab>
            ))}
          </TabList>
          {LANGUAGES.map((language) => (
            <TabPanel id={language} key={language}>
              <AccessibilityRenderer
                document={getAccessibilityDocument(language)}
              />
            </TabPanel>
          ))}
        </Tabs>
      </div>
    </section>
  );
}
