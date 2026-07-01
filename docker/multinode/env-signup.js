window.env = {
  KNODIA_ORG_URL: "https://knodia.org/",
  // Same-origin relative path: nginx reverse-proxies /signup-manager, keeping
  // the OIDC flow on one origin and independent of the host port.
  OIDC_SESSION_FLOW_START_URL: "/signup-manager/auth/oidc/start",
  SIGNUP_MANAGER_URL: "/signup-manager",
};
