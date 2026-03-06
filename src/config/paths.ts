import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// This file lives in src/config, so go up twice to project root, then /public
export const paths = {
  publicDir: path.join(__dirname, "..", "..", "public"),
};
