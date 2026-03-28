import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import db from "../../db/connection.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main(): Promise<void> {
  const schemaPath = path.join(__dirname, "../../db/schema-setup.sql");
  const schemaSql = await fs.readFile(schemaPath, "utf8");

  await db.none(schemaSql);

  console.log("Schema setup completed successfully.");
}

main().catch((error: unknown) => {
  console.error("Schema setup failed.");

  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(error);
  }

  process.exit(1);
});
