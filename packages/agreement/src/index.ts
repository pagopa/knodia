import { createApp } from "./app.js";

const PORT = Number(process.env.PORT) || 3000;
const app = createApp(process.env.SERVICE_NAME || "http-status-api");

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Service is running on port ${PORT}`);
});
