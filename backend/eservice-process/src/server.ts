import Fastify from "fastify";
const fastify = Fastify();

fastify.get("/status", async () => {});

await fastify.listen({ port: 3000 });
