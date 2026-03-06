import { Router, type Request, type Response } from "express";
import path from "path";
import { paths } from "../config/paths.js";

export const rootRouter = Router();

rootRouter.get("/", (_req: Request, res: Response) => {
  res.sendFile(path.join(paths.publicDir, "index.html"));
});
