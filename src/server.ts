import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";

import db from "./db/connection.js";
import authRoutes from "./routes/auth.js";
import homeRoutes from "./routes/home.js";
import lobbyRoutes from "./routes/lobby.js";
import testRoutes from "./routes/test.js";
import { requestLogger } from "./middleware/logging.js";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PgSessionStore = connectPgSimple(session);

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error("SESSION_SECRET is not set.");
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));
app.use(requestLogger);

app.use(
  session({
    store: new PgSessionStore({
      pgPromise: db,
      tableName: "session",
    }),
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    },
  }),
);

app.use("/", homeRoutes);
app.use("/auth", authRoutes);
app.use("/lobby", lobbyRoutes);
app.use("/test", testRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${String(PORT)}`);
});
