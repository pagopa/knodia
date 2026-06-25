window.env = {
  KNODIA_ORG_URL: "https://knodia.org/",
  // Relative, same-origin: the browser hits the signup-frontend nginx, which
  // reverse-proxies /signup-manager to the signup-manager container. Keeps the
  // whole OIDC flow on one origin and independent of the host port.
  OIDC_SESSION_FLOW_START_URL: "/signup-manager/auth/oidc/start",
  SIGNUP_MANAGER_URL: "/signup-manager",
};
