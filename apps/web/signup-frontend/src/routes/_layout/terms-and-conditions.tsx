import { type TermsLang } from "@knodia/terms-and-conditions-models";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { TermsRenderer } from "@/components/features/TermsRenderer";
import { Tab, TabList, TabPanel, Tabs } from "@/components/ui";
import { useAuthContext } from "@/contexts/auth";
import { getCurrentSignupUserQuery } from "@/services/queries";
import {
  resolveAcceptanceDate,
  retrieveKnodiaVersionLabel,
  retrieveTermsDocument,
} from "@/services/terms";

const LANGUAGES = ["en", "it"] as const satisfies readonly TermsLang[];

const LANGUAGE_LABELS: Record<TermsLang, string> = {
  en: "English version",
  it: "Italian version",
};

export const Route = createFileRoute("/_layout/terms-and-conditions")({
  component: RouteComponent,
  // Language lives in the query param so the page stays shareable; the tabs navigate it.
  validateSearch: z.object({
    lang: z.enum(["it", "en"]).default("en").catch("en"),
  }),
});

function RouteComponent() {
  const { lang } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { isAuthenticated } = useAuthContext();

  // Public page: skip /user/me while logged out, else the 401 interceptor redirects to login.
  const currentUser = useQuery({
    ...getCurrentSignupUserQuery(),
    enabled: isAuthenticated,
  });

  const knodiaVersion = retrieveKnodiaVersionLabel();

  return (
    <section className="mx-auto w-full max-w-(--header-shell-max) flex-1 px-(--header-inline-padding) pt-(--header-height) pb-16">
      <Tabs
        kind="fill"
        onSelectionChange={(key) => {
          if (key === "en" || key === "it")
            void navigate({ search: { lang: key } });
        }}
        selectedKey={lang}
      >
        <TabList
          aria-label="Terms and conditions language"
          className="mb-10 max-w-xl"
        >
          {LANGUAGES.map((language) => (
            <Tab id={language} key={language}>
              {LANGUAGE_LABELS[language]}
            </Tab>
          ))}
        </TabList>
        {LANGUAGES.map((language) => (
          <TabPanel id={language} key={language}>
            <TermsRenderer
              date={resolveAcceptanceDate(
                language,
                isAuthenticated,
                currentUser.data,
              )}
              document={retrieveTermsDocument(language)}
              knodiaVersion={knodiaVersion}
            />
          </TabPanel>
        ))}
      </Tabs>
    </section>
  );
}
