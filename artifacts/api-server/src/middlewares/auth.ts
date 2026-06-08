import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/auth";

export type AuthedRequest = Request & { userId?: number };

export function authOptional(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    const payload = verifyToken(header.slice(7));
    if (payload) (req as AuthedRequest).userId = payload.userId;
  }
  next();
}

export function authRequired(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Требуется вход в аккаунт." });
    return;
  }
  const payload = verifyToken(header.slice(7));
  if (!payload) {
    res.status(401).json({ error: "Сессия истекла. Войдите снова." });
    return;
  }
  (req as AuthedRequest).userId = payload.userId;
  next();
}
