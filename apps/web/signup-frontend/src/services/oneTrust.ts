type OneTrustPrivacyPolicyLanguage = "en" | "it";

type OneTrustWindow = Window & {
  OneTrust?: {
    init?: boolean;
    NoticeApi?: {
      Initialized: Promise<void>;
      LoadNotices: (
        noticeUrls: string[],
        sendCallback?: boolean,
        language?: string,
        showLanguageDropdown?: boolean,
      ) => Promise<void>;
    };
  };
};
const extendedWindow = window as OneTrustWindow;

const OT_PRIVACY_NOTICE_SCRIPT_ID = "otprivacy-notice-script";
export const OT_PRIVACY_NOTICE_TARGET_ID =
  "otnotice-7197cf41-6b45-430a-921f-bdee20487448";
const OT_PRIVACY_NOTICE_URL =
  "https://privacyportalde-cdn.onetrust.com/storage-container/77f17844-04c3-4969-a11d-462ee77acbe1/privacy-notices/7197cf41-6b45-430a-921f-bdee20487448/published/privacynotice.json";
const OT_PRIVACY_NOTICE_SETTINGS_HASH =
  "eyJjYWxsYmFja1VybCI6Imh0dHBzOi8vcHJpdmFjeXBvcnRhbC1kZS5vbmV0cnVzdC5jb20vcmVxdWVzdC92MS9wcml2YWN5Tm90aWNlcy9zdGF0cy92aWV3cyIsImNvbnRlbnRBcGlVcmwiOiJodHRwczovL3ByaXZhY3lwb3J0YWwtZGUub25ldHJ1c3QuY29tL3JlcXVlc3QvdjEvZW50ZXJwcmlzZXBvbGljeS9kaWdpdGFscG9saWN5L2NvbnRlbnQiLCJtZXRhZGF0YUFwaVVybCI6Imh0dHBzOi8vcHJpdmFjeXBvcnRhbC1kZS5vbmV0cnVzdC5jb20vcmVxdWVzdC92MS9lbnRlcnByaXNlcG9saWN5L2RpZ2l0YWxwb2xpY3kvbWV0YS1kYXRhIn0=";
const OT_SCRIPT_LOAD_TIMEOUT_MS = 10_000;

let oneTrustScriptLoadPromise: Promise<void> | undefined;

export const ONE_TRUST_PRIVACY_POLICY_SCRIPT_ATTRIBUTES = {
  charSet: "UTF-8",
  id: OT_PRIVACY_NOTICE_SCRIPT_ID,
  settings: OT_PRIVACY_NOTICE_SETTINGS_HASH,
  src: "https://privacyportalde-cdn.onetrust.com/privacy-notice-scripts/otnotice-1.0.min.js",
  type: "text/javascript",
} as const;

export async function loadOneTrustPrivacyPolicy(
  lang: OneTrustPrivacyPolicyLanguage,
): Promise<void> {
  await waitForOneTrustScript();

  const noticeApi = extendedWindow.OneTrust?.NoticeApi;
  if (!noticeApi) {
    throw new Error("OneTrust NoticeApi is not available");
  }

  await noticeApi.Initialized;
  await noticeApi.LoadNotices([OT_PRIVACY_NOTICE_URL], true, lang, false);
  cleanupOneTrustNoticeSpacing();
}

function cleanupOneTrustNoticeSpacing() {
  const notice = document.getElementById(OT_PRIVACY_NOTICE_TARGET_ID);
  if (!notice) return;

  notice.querySelectorAll("br").forEach((br) => br.remove());
  notice.querySelectorAll("p").forEach((paragraph) => {
    if (!paragraph.textContent?.trim() && paragraph.children.length === 0) {
      paragraph.remove();
    }
  });
}

function waitForOneTrustScript(): Promise<void> {
  if (extendedWindow.OneTrust?.NoticeApi) {
    return Promise.resolve();
  }

  if (oneTrustScriptLoadPromise) {
    return oneTrustScriptLoadPromise;
  }

  const script = document.getElementById(
    OT_PRIVACY_NOTICE_SCRIPT_ID,
  ) as HTMLScriptElement | null;

  if (!script) {
    return Promise.reject(
      new Error("OneTrust privacy notice script not found"),
    );
  }

  oneTrustScriptLoadPromise = new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      window.clearInterval(apiPollingInterval);
      window.clearTimeout(timeout);
      script.removeEventListener("load", handleLoad);
      script.removeEventListener("error", handleError);
    };

    const resolveIfNoticeApiIsAvailable = () => {
      if (!extendedWindow.OneTrust?.NoticeApi) return false;

      cleanup();
      resolve();
      return true;
    };

    const handleLoad = () => {
      resolveIfNoticeApiIsAvailable();
    };

    const handleError = () => {
      cleanup();
      reject(new Error("Unable to load OneTrust privacy notice script"));
    };

    const apiPollingInterval = window.setInterval(
      resolveIfNoticeApiIsAvailable,
      50,
    );

    const timeout = window.setTimeout(() => {
      cleanup();
      reject(
        new Error("Timed out while loading OneTrust privacy notice script"),
      );
    }, OT_SCRIPT_LOAD_TIMEOUT_MS);

    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });
  }).catch((error: unknown) => {
    oneTrustScriptLoadPromise = undefined;
    throw error;
  });

  return oneTrustScriptLoadPromise;
}
