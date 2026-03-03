import express, { type Request, type Response } from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// Needed because you're using ESM ("type": "module")
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving
const publicDir = path.join(__dirname, "..", "public");
app.use(express.static(publicDir));

// Basic home route (requirement)
app.get("/", (_req: Request, res: Response) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

// Simple health route (nice for demo)
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ ok: true });
});

const port = Number(process.env.PORT) || 3000;

app.listen(port, () => {
  console.log(`Server running on http://localhost:${String(port)}`);
});
