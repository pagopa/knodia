import { createSignupManagerApiClient } from "@knodia/signup-manager-client";
import axios from "axios";

import { config } from "@/config/config";

export const client = createSignupManagerApiClient({
  axios,
  baseURL: config.signupManagerUrl,
});
