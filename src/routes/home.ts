import { Router, type Request, type Response } from "express";

const homeRouter = Router();

homeRouter.get("/", (request: Request, response: Response) => {
  if (request.session.user) {
    response.redirect("/lobby");
    return;
  }

  response.redirect("/auth/login");
});

export default homeRouter;
