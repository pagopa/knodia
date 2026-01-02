import { client } from "./generated/index.ts";

// TODO: maybe move this to the BFF
client.setConfig({
  baseUrl: "http://localhost:3000",
});
export { client as catalogClient };

export * from "./generated/index.ts";
