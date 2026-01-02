import { client } from "./generated/index.ts";

client.setConfig({
  baseUrl: "http://localhost:3000",
});
export { client as catalogClient };

export * from "./generated/index.ts";
