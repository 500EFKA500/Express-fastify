import Fastify from "fastify";
import "dotenv/config";
import cors from "@fastify/cors";

import { initDb } from "./database/database.js";
import { profileRoutes } from "./routes/routes.js";

const port = Number(process.env.PROFILE_PORT) || 3001;
const authOrigin = process.env.AUTH_SERVICE_URL || "http://localhost:3000";
const fastify = Fastify({ logger: false });

await initDb();
await fastify.register(cors, { origin: authOrigin });
await fastify.register(profileRoutes);

fastify.get("/health", async () => {
    return { success: true };
});

await fastify.listen({ port, host: "0.0.0.0" });

console.log(`http://localhost:${port}`);
