import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";

const JWT_SECRET = (() => {
  const fromEnv = process.env["JWT_SECRET"] || process.env["SESSION_SECRET"];
  if (fromEnv) return fromEnv;
  if (process.env["NODE_ENV"] === "production") {
    throw new Error(
      "JWT_SECRET (or SESSION_SECRET) must be set in production to issue auth tokens.",
    );
  }
  return "dev-only-insecure-secret-change-me";
})();
const JWT_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

export interface JwtPayload {
  userId: number;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function issueToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_TTL_SECONDS });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload | string;
    if (typeof decoded === "string") return null;
    if (typeof decoded.userId !== "number") return null;
    return { userId: decoded.userId };
  } catch {
    return null;
  }
}

export function generateRandomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

interface StatePayload {
  kind: string;
  nonce: string;
}

export function issueShortLivedState(opts: { kind: string }): string {
  const payload: StatePayload = { kind: opts.kind, nonce: generateRandomToken(16) };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: 600 });
}

export function verifyShortLivedState(token: string, expectedKind: string): boolean {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as StatePayload | string;
    if (typeof decoded === "string") return false;
    return decoded.kind === expectedKind;
  } catch {
    return false;
  }
}
