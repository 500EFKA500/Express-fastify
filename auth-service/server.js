import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";

import pageRouter from "./routers/pages.js";
import apiRouter from "./routers/api.js";
import { initDb } from "./database/database.js";

const app = express();
const port = Number(process.env.AUTH_PORT) || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

await initDb();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use("/", pageRouter);
app.use("/api", apiRouter);

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
