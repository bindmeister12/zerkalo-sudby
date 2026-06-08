import { Router } from "express";
import { eq, count, sql } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { db, usersTable, appSettingsTable } from "@workspace/db";
import type { Request, Response, NextFunction } from "express";

const router: ReturnType<typeof Router> = Router();

const JWT_SECRET = (() => {
  const s = process.env["JWT_SECRET"] || process.env["SESSION_SECRET"];
  if (s) return s;
  if (process.env["NODE_ENV"] === "production") throw new Error("JWT_SECRET must be set");
  return "dev-only-insecure-secret-change-me";
})();

function issueAdminToken(): string {
  return jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: 60 * 60 * 24 });
}

function verifyAdminToken(token: string): boolean {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { role?: string };
    return decoded.role === "admin";
  } catch {
    return false;
  }
}

function adminAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Требуется авторизация" });
    return;
  }
  if (!verifyAdminToken(header.slice(7))) {
    res.status(403).json({ error: "Неверный или истёкший токен" });
    return;
  }
  next();
}

async function ensureDefaultSettings(): Promise<void> {
  const existing = await db
    .select()
    .from(appSettingsTable)
    .where(eq(appSettingsTable.key, "subscriptions_enabled"));
  if (existing.length === 0) {
    await db
      .insert(appSettingsTable)
      .values({ key: "subscriptions_enabled", value: "false" })
      .onConflictDoNothing();
  }
}

router.post("/login", async (req, res) => {
  const { password } = req.body as { password?: string };
  const adminPassword = process.env["ADMIN_PASSWORD"];
  if (!adminPassword) {
    res.status(503).json({ error: "ADMIN_PASSWORD не настроен. Установите переменную окружения." });
    return;
  }
  if (!password || password !== adminPassword) {
    res.status(401).json({ error: "Неверный пароль" });
    return;
  }
  const token = issueAdminToken();
  res.json({ token });
});

router.get("/stats", adminAuthMiddleware, async (req, res) => {
  await ensureDefaultSettings();

  const [totalResult] = await db.select({ count: count() }).from(usersTable);
  const [premiumResult] = await db
    .select({ count: count() })
    .from(usersTable)
    .where(eq(usersTable.isPremium, true));

  const settingsRows = await db.select().from(appSettingsTable);
  const settings: Record<string, string> = {};
  for (const row of settingsRows) {
    settings[row.key] = row.value;
  }

  res.json({
    totalUsers: totalResult?.count ?? 0,
    premiumUsers: premiumResult?.count ?? 0,
    subscriptionsEnabled: settings["subscriptions_enabled"] === "true",
  });
});

router.get("/users", adminAuthMiddleware, async (req, res) => {
  const { search, limit: limitParam, offset: offsetParam } = req.query as {
    search?: string;
    limit?: string;
    offset?: string;
  };

  const limit = Math.min(Number(limitParam) || 50, 100);
  const offset = Number(offsetParam) || 0;

  let rows;
  if (search && search.trim()) {
    const pattern = `%${search.trim().toLowerCase()}%`;
    rows = await db
      .select({
        id: usersTable.id,
        email: usersTable.email,
        displayName: usersTable.displayName,
        isPremium: usersTable.isPremium,
        premiumGrantedAt: usersTable.premiumGrantedAt,
        createdAt: usersTable.createdAt,
        vkLinked: sql<boolean>`(${usersTable.vkUserId} IS NOT NULL)`,
      })
      .from(usersTable)
      .where(
        sql`(LOWER(${usersTable.email}) LIKE ${pattern} OR LOWER(${usersTable.displayName}) LIKE ${pattern})`
      )
      .orderBy(usersTable.createdAt)
      .limit(limit)
      .offset(offset);
  } else {
    rows = await db
      .select({
        id: usersTable.id,
        email: usersTable.email,
        displayName: usersTable.displayName,
        isPremium: usersTable.isPremium,
        premiumGrantedAt: usersTable.premiumGrantedAt,
        createdAt: usersTable.createdAt,
        vkLinked: sql<boolean>`(${usersTable.vkUserId} IS NOT NULL)`,
      })
      .from(usersTable)
      .orderBy(usersTable.createdAt)
      .limit(limit)
      .offset(offset);
  }

  res.json({ users: rows, limit, offset });
});

router.patch("/users/:id/premium", adminAuthMiddleware, async (req, res) => {
  const id = Number(req.params["id"]);
  if (!id || isNaN(id)) {
    res.status(400).json({ error: "Неверный ID пользователя" });
    return;
  }
  const { isPremium } = req.body as { isPremium?: boolean };
  if (typeof isPremium !== "boolean") {
    res.status(400).json({ error: "isPremium должен быть boolean" });
    return;
  }

  const [updated] = await db
    .update(usersTable)
    .set({
      isPremium,
      premiumGrantedAt: isPremium ? new Date() : null,
    })
    .where(eq(usersTable.id, id))
    .returning({ id: usersTable.id, isPremium: usersTable.isPremium, premiumGrantedAt: usersTable.premiumGrantedAt });

  if (!updated) {
    res.status(404).json({ error: "Пользователь не найден" });
    return;
  }

  res.json({ user: updated });
});

router.get("/settings", adminAuthMiddleware, async (_req, res) => {
  await ensureDefaultSettings();
  const rows = await db.select().from(appSettingsTable);
  const settings: Record<string, string> = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  res.json({ settings });
});

router.patch("/settings", adminAuthMiddleware, async (req, res) => {
  const { subscriptionsEnabled } = req.body as { subscriptionsEnabled?: boolean };
  if (typeof subscriptionsEnabled !== "boolean") {
    res.status(400).json({ error: "subscriptionsEnabled должен быть boolean" });
    return;
  }

  await db
    .insert(appSettingsTable)
    .values({ key: "subscriptions_enabled", value: subscriptionsEnabled ? "true" : "false" })
    .onConflictDoUpdate({
      target: appSettingsTable.key,
      set: { value: subscriptionsEnabled ? "true" : "false", updatedAt: new Date() },
    });

  res.json({ ok: true, subscriptionsEnabled });
});

export default router;
