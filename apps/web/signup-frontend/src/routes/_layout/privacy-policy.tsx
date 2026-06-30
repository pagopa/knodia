import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import z from "zod";

import { Tab, TabList, TabPanel, Tabs } from "@/components/ui";
import {
  loadOneTrustPrivacyPolicy,
  ONE_TRUST_PRIVACY_POLICY_SCRIPT_ATTRIBUTES,
} from "@/services/oneTrust";

const LANGUAGE_LABELS = {
  en: "English version",
  it: "Italian version",
} as const;

export const Route = createFileRoute("/_layout/privacy-policy")({
  component: RouteComponent,
  head: () => ({
    scripts: [ONE_TRUST_PRIVACY_POLICY_SCRIPT_ATTRIBUTES],
  }),
  validateSearch: z.object({
    lang: z.enum(["en", "it"]).catch("en"),
  }),
});

function RouteComponent() {
  const lang = Route.useSearch().lang;
  const navigate = Route.useNavigate();

  useEffect(() => {
    void loadOneTrustPrivacyPolicy(lang);
  }, [lang]);

  return (
    <section className="privacy-policy-page mx-auto w-full max-w-(--header-shell-max) flex-1 px-(--header-inline-padding) pt-50 pb-28">
      <div className="w-full max-w-201.25">
        <h1 className="mb-14 font-heading text-[56px] leading-16 font-medium tracking-normal text-primary-violet">
          Privacy policy
        </h1>
        <Tabs
          kind="fill"
          onSelectionChange={(key) => {
            if (key === "en" || key === "it") {
              void navigate({ search: { lang: key } });
            }
          }}
          selectedKey={lang}
        >
          <TabList
            aria-label="Privacy policy language"
            className="mb-14 w-full max-w-156"
          >
            {(["en", "it"] as const).map((language) => (
              <Tab id={language} key={language}>
                {LANGUAGE_LABELS[language]}
              </Tab>
            ))}
          </TabList>
          <TabPanel id={lang}>
            <div
              className="otnotice privacy-policy-page__notice"
              id="otnotice-7197cf41-6b45-430a-921f-bdee20487448"
            ></div>
          </TabPanel>
        </Tabs>
      </div>
    </section>
  );
}
