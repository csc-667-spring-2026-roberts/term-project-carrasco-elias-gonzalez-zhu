import type { Request } from "express";

export function wantsJson(request: Request): boolean {
  const contentType = request.get("content-type") || "";
  const accept = request.get("accept") || "";

  return contentType.includes("application/json") || accept.includes("application/json");
}
