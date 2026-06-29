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
const OT_PRIVACY_NOTICE_TARGET_ID =
  "otnotice-7197cf41-6b45-430a-921f-bdee20487448";

export function cleanupOneTrustPrivacyPolicyScript() {
  const el = document.getElementById(OT_PRIVACY_NOTICE_SCRIPT_ID);
  if (el) el.remove();
}

export function loadOneTrustPrivacyPolicyScript(lang: "en" | "it") {
  const isAlreadyLoaded = !!document.getElementById(
    OT_PRIVACY_NOTICE_SCRIPT_ID,
  );
  if (isAlreadyLoaded) return;

  const script = document.createElement("script");

  script.id = OT_PRIVACY_NOTICE_SCRIPT_ID;
  script.src =
    "https://privacyportalde-cdn.onetrust.com/privacy-notice-scripts/otnotice-1.0.min.js";
  script.type = "text/javascript";
  script.charset = "UTF-8";
  script.setAttribute(
    "settings",
    "eyJjYWxsYmFja1VybCI6Imh0dHBzOi8vcHJpdmFjeXBvcnRhbC1kZS5vbmV0cnVzdC5jb20vcmVxdWVzdC92MS9wcml2YWN5Tm90aWNlcy9zdGF0cy92aWV3cyIsImNvbnRlbnRBcGlVcmwiOiJodHRwczovL3ByaXZhY3lwb3J0YWwtZGUub25ldHJ1c3QuY29tL3JlcXVlc3QvdjEvZW50ZXJwcmlzZXBvbGljeS9kaWdpdGFscG9saWN5L2NvbnRlbnQiLCJtZXRhZGF0YUFwaVVybCI6Imh0dHBzOi8vcHJpdmFjeXBvcnRhbC1kZS5vbmV0cnVzdC5jb20vcmVxdWVzdC92MS9lbnRlcnByaXNlcG9saWN5L2RpZ2l0YWxwb2xpY3kvbWV0YS1kYXRhIn0=",
  );

  script.onload = () => {
    const noticeApi = extendedWindow.OneTrust?.NoticeApi;
    if (noticeApi) {
      void noticeApi.Initialized.then(async () => {
        clearOneTrustNotice();

        await noticeApi.LoadNotices(
          [
            "https://privacyportalde-cdn.onetrust.com/storage-container/77f17844-04c3-4969-a11d-462ee77acbe1/privacy-notices/7197cf41-6b45-430a-921f-bdee20487448/published/privacynotice.json",
          ],
          true,
          lang,
          false,
        );

        cleanupOneTrustNoticeSpacing();
      });
    }
  };
  document.head.appendChild(script);
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

function clearOneTrustNotice() {
  const notice = document.getElementById(OT_PRIVACY_NOTICE_TARGET_ID);
  if (notice) notice.innerHTML = "";
}
