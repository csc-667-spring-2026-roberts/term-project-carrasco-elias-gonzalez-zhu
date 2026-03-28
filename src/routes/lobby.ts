import { Router, type Request, type Response } from "express";

import { requireAuth } from "../middleware/auth.js";

const lobbyRouter = Router();

lobbyRouter.get("/", requireAuth, (request: Request, response: Response) => {
  response.render("lobby", {
    title: "Lobby",
    user: request.session.user,
    error: undefined,
  });
});

export default lobbyRouter;
