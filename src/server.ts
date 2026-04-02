import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";

import livereload from "livereload";
import connectLivereload from "connect-livereload";

import db from "./db/connection.js";
import { requestLogger } from "./middleware/logging.js";
import { authRouter } from "./routes/auth.js";
import homeRoutes from "./routes/home.js";
import lobbyRoutes from "./routes/lobby.js";

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

// Enable live reload in development (disabled in production)
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
const liveReloadServer = livereload.createServer();

// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
liveReloadServer.watch([path.join(__dirname, "../public"), path.join(__dirname, "../views")]);

// eslint-disable-next-line @typescript-eslint/no-unsafe-call
app.use(connectLivereload());

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
app.use("/auth", authRouter);
app.use("/lobby", lobbyRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${String(PORT)}`);
});
