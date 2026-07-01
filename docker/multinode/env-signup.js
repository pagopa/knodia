window.env = {
  KNODIA_ORG_COMPANY_DETAILS_URL: "https://knodia.org/company-details",
  KNODIA_ORG_URL: "https://knodia.org/",
  LYNX_PROTOTYPE_URL: "http://localhost:5002/ui",
  // Same-origin relative path: nginx reverse-proxies /signup-manager, keeping
  // the OIDC flow on one origin and independent of the host port.
  OIDC_SESSION_FLOW_START_URL: "/signup-manager/auth/oidc/start",
  ORION_PROTOTYPE_URL: "http://localhost:5001/ui",
  SIGNUP_MANAGER_URL: "/signup-manager",
};
