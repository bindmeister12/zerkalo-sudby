import { Router } from "express";
import { and, eq, isNull } from "drizzle-orm";
import {
  db,
  emailVerificationsTable,
  passwordResetsTable,
  usersTable,
} from "@workspace/db";
import {
  generateRandomToken,
  hashPassword,
  isValidEmail,
  issueToken,
  verifyPassword,
} from "../lib/auth";
import { mailer } from "../lib/mailer";
import { authRequired, type AuthedRequest } from "../middlewares/auth";

const router: ReturnType<typeof Router> = Router();

const PUBLIC_BASE_URL =
  process.env["PUBLIC_BASE_URL"] || (process.env["REPLIT_DOMAINS"]?.split(",")[0]
    ? `https://${process.env["REPLIT_DOMAINS"]!.split(",")[0]}`
    : "http://localhost");

function publicUserShape(u: {
  id: number;
  email: string | null;
  vkUserId: string | null;
  displayName: string | null;
  emailVerifiedAt: Date | null;
  birthDate?: string | null;
  birthTime?: string | null;
  gender?: string | null;
  isPremium?: boolean;
}) {
  return {
    id: u.id,
    email: u.email,
    displayName: u.displayName,
    vkLinked: u.vkUserId != null,
    emailVerified: u.emailVerifiedAt != null,
    birthDate: u.birthDate ?? null,
    birthTime: u.birthTime ?? null,
    gender: u.gender ?? null,
    isPremium: u.isPremium ?? false,
  };
}

import { issueShortLivedState, verifyShortLivedState } from "../lib/auth";

router.post("/register", async (req, res) => {
  const { email, password, displayName } = req.body as {
    email?: string;
    password?: string;
    displayName?: string;
  };
  if (!email || !isValidEmail(email)) {
    res.status(400).json({ error: "Введите корректный email." });
    return;
  }
  if (!password || password.length < 8) {
    res.status(400).json({ error: "Пароль должен содержать минимум 8 символов." });
    return;
  }

  const normalizedEmail = email.toLowerCase().trim();

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, normalizedEmail));
  if (existing.length > 0) {
    res.status(409).json({ error: "Пользователь с таким email уже зарегистрирован." });
    return;
  }

  const passwordHash = await hashPassword(password);
  const inserted = await db
    .insert(usersTable)
    .values({
      email: normalizedEmail,
      passwordHash,
      displayName: displayName?.trim() || null,
    })
    .returning();
  const user = inserted[0]!;

  const verifyToken = generateRandomToken();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);
  await db.insert(emailVerificationsTable).values({
    userId: user.id,
    token: verifyToken,
    expiresAt,
  });

  let mailerWarning: string | null = null;
  try {
    if (!mailer.isConfigured) {
      mailerWarning = "Email-провайдер не настроен. Письмо с подтверждением не отправлено — обратитесь в поддержку.";
    }
    await mailer.send({
      to: normalizedEmail,
      subject: "Подтвердите email — Зеркало Судьбы",
      html: `<p>Здравствуйте!</p><p>Чтобы завершить регистрацию в «Зеркале Судьбы», подтвердите email:</p><p><a href="${PUBLIC_BASE_URL}/api/auth/verify-email?token=${verifyToken}">Подтвердить email</a></p><p>Ссылка действует 24 часа.</p>`,
      text: `Подтвердите email: ${PUBLIC_BASE_URL}/api/auth/verify-email?token=${verifyToken}`,
    });
  } catch (err) {
    req.log.warn({ err }, "register: failed to send verification email");
    mailerWarning = "Не удалось отправить письмо с подтверждением. Запросите его повторно позже.";
  }

  const token = issueToken({ userId: user.id });
  res.status(201).json({
    token,
    user: publicUserShape(user),
    mailerWarning,
  });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    res.status(400).json({ error: "Введите email и пароль." });
    return;
  }
  const normalizedEmail = email.toLowerCase().trim();
  const rows = await db.select().from(usersTable).where(eq(usersTable.email, normalizedEmail));
  const user = rows[0];
  if (!user || !user.passwordHash) {
    res.status(401).json({ error: "Неверный email или пароль." });
    return;
  }
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    res.status(401).json({ error: "Неверный email или пароль." });
    return;
  }
  const token = issueToken({ userId: user.id });
  res.json({ token, user: publicUserShape(user) });
});

router.post("/logout", (_req, res) => {
  res.json({ ok: true });
});

router.get("/me", authRequired, async (req, res) => {
  const userId = (req as AuthedRequest).userId!;
  const rows = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  const user = rows[0];
  if (!user) {
    res.status(404).json({ error: "Пользователь не найден." });
    return;
  }
  res.json({ user: publicUserShape(user) });
});

router.patch("/me", authRequired, async (req, res) => {
  const userId = (req as AuthedRequest).userId!;
  const { displayName, birthDate, birthTime, gender } = req.body as {
    displayName?: string | null;
    birthDate?: string | null;
    birthTime?: string | null;
    gender?: string | null;
  };
  const patch: Record<string, string | null> = {};
  if (displayName !== undefined) patch["displayName"] = displayName?.trim() || null;
  if (birthDate !== undefined) patch["birthDate"] = birthDate || null;
  if (birthTime !== undefined) patch["birthTime"] = birthTime || null;
  if (gender !== undefined) patch["gender"] = gender || null;
  if (Object.keys(patch).length === 0) {
    res.status(400).json({ error: "Нет полей для обновления." });
    return;
  }
  const rows = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  const existing = rows[0];
  if (!existing) {
    res.status(404).json({ error: "Пользователь не найден." });
    return;
  }
  // Only fill fields that are currently empty — first-login attach should never
  // clobber data the user later updates from the app.
  const merged: Record<string, string | null> = {};
  for (const k of Object.keys(patch)) {
    if (existing[k as keyof typeof existing] == null) merged[k] = patch[k]!;
  }
  if (Object.keys(merged).length > 0) {
    await db.update(usersTable).set(merged).where(eq(usersTable.id, userId));
  }
  const fresh = (await db.select().from(usersTable).where(eq(usersTable.id, userId)))[0]!;
  res.json({ user: publicUserShape(fresh) });
});

router.get("/verify-email", async (req, res) => {
  const token = typeof req.query.token === "string" ? req.query.token : null;
  if (!token) {
    res.status(400).send("Некорректная ссылка.");
    return;
  }
  const rows = await db
    .select()
    .from(emailVerificationsTable)
    .where(and(eq(emailVerificationsTable.token, token), isNull(emailVerificationsTable.consumedAt)));
  const record = rows[0];
  if (!record || record.expiresAt < new Date()) {
    res.status(400).send("Ссылка истекла или уже использована.");
    return;
  }
  await db
    .update(usersTable)
    .set({ emailVerifiedAt: new Date() })
    .where(eq(usersTable.id, record.userId));
  await db
    .update(emailVerificationsTable)
    .set({ consumedAt: new Date() })
    .where(eq(emailVerificationsTable.id, record.id));
  res.send("<h1>Email подтверждён</h1><p>Можно вернуться в приложение «Зеркало Судьбы».</p>");
});

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body as { email?: string };
  if (!email || !isValidEmail(email)) {
    res.status(400).json({ error: "Введите корректный email." });
    return;
  }
  const normalizedEmail = email.toLowerCase().trim();
  const rows = await db.select().from(usersTable).where(eq(usersTable.email, normalizedEmail));
  const user = rows[0];

  if (user) {
    const token = generateRandomToken();
    await db.insert(passwordResetsTable).values({
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
    });
    try {
      await mailer.send({
        to: normalizedEmail,
        subject: "Восстановление пароля — Зеркало Судьбы",
        html: `<p>Код для восстановления пароля: <b>${token}</b></p><p>Действует 1 час.</p>`,
        text: `Код для восстановления пароля: ${token} (действует 1 час)`,
      });
    } catch (err) {
      req.log.warn({ err }, "forgot-password: failed to send email");
    }
  }
  res.json({ ok: true, mailerConfigured: mailer.isConfigured });
});

router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body as { token?: string; newPassword?: string };
  if (!token || !newPassword || newPassword.length < 8) {
    res.status(400).json({ error: "Введите код и новый пароль (не менее 8 символов)." });
    return;
  }
  const rows = await db
    .select()
    .from(passwordResetsTable)
    .where(and(eq(passwordResetsTable.token, token), isNull(passwordResetsTable.consumedAt)));
  const record = rows[0];
  if (!record || record.expiresAt < new Date()) {
    res.status(400).json({ error: "Код истёк или неверен." });
    return;
  }
  const passwordHash = await hashPassword(newPassword);
  await db.update(usersTable).set({ passwordHash }).where(eq(usersTable.id, record.userId));
  await db
    .update(passwordResetsTable)
    .set({ consumedAt: new Date() })
    .where(eq(passwordResetsTable.id, record.id));
  res.json({ ok: true });
});

router.get("/vk/config", (_req, res) => {
  const appId = process.env["VK_APP_ID"];
  const redirectUri = process.env["VK_REDIRECT_URI"] || `${PUBLIC_BASE_URL}/api/auth/vk/callback`;
  if (!appId) {
    res.status(503).json({ configured: false, error: "Вход через VK временно недоступен." });
    return;
  }
  const state = issueShortLivedState({ kind: "vk" });
  const authUrl =
    `https://id.vk.com/auth?app_id=${encodeURIComponent(appId)}` +
    `&response_type=code` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${encodeURIComponent(state)}` +
    `&scope=email`;
  res.json({ configured: true, authUrl, redirectUri, state });
});

// Browser-facing callback: VK redirects here. The mobile app uses
// expo-web-browser.openAuthSessionAsync which intercepts the redirect URL
// itself, but this endpoint also renders a small HTML page so that desktop
// completion works (and the route exists for the documented contract).
router.get("/vk/callback", (req, res) => {
  const code = typeof req.query.code === "string" ? req.query.code : null;
  const state = typeof req.query.state === "string" ? req.query.state : null;
  const error = typeof req.query.error === "string" ? req.query.error : null;
  if (error) {
    res.status(400).send(`<h1>Ошибка входа VK</h1><p>${error}</p>`);
    return;
  }
  if (!code) {
    res.status(400).send("<h1>Не удалось войти через VK</h1><p>VK не вернул код.</p>");
    return;
  }
  res.send(
    `<!doctype html><meta charset="utf-8"><title>VK вход</title>` +
      `<style>body{font-family:system-ui;background:#0A0010;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center;padding:20px}</style>` +
      `<div><h1>Готово</h1><p>Можно вернуться в приложение «Зеркало Судьбы».</p>` +
      `<p style="opacity:.5;font-size:12px">code=${code.slice(0, 8)}… state=${state ?? "—"}</p></div>`,
  );
});

router.post("/vk/exchange", async (req, res) => {
  const { code, redirectUri, state } = req.body as { code?: string; redirectUri?: string; state?: string };
  const appId = process.env["VK_APP_ID"];
  const appSecret = process.env["VK_APP_SECRET"];
  if (!appId || !appSecret) {
    res.status(503).json({ error: "Вход через VK временно недоступен." });
    return;
  }
  if (!code || !redirectUri) {
    res.status(400).json({ error: "Некорректные параметры VK." });
    return;
  }
  if (!state || !verifyShortLivedState(state, "vk")) {
    res.status(400).json({ error: "Сессия VK истекла. Попробуйте войти заново." });
    return;
  }
  try {
    const tokenRes = await fetch(
      `https://oauth.vk.com/access_token?client_id=${appId}&client_secret=${appSecret}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${encodeURIComponent(code)}`,
    );
    const tokenJson = (await tokenRes.json()) as { user_id?: number; email?: string; access_token?: string; error?: string };
    if (!tokenRes.ok || !tokenJson.user_id) {
      req.log.warn({ tokenJson }, "vk/exchange: token error");
      res.status(401).json({ error: "Не удалось завершить вход через VK." });
      return;
    }
    const vkUserId = String(tokenJson.user_id);
    const email = tokenJson.email?.toLowerCase().trim() ?? null;

    const existing = await db.select().from(usersTable).where(eq(usersTable.vkUserId, vkUserId));
    let user = existing[0];
    if (!user) {
      const inserted = await db
        .insert(usersTable)
        .values({ vkUserId, email, emailVerifiedAt: email ? new Date() : null })
        .returning();
      user = inserted[0]!;
    }
    const token = issueToken({ userId: user.id });
    res.json({ token, user: publicUserShape(user) });
  } catch (err) {
    req.log.error({ err }, "vk/exchange failed");
    res.status(502).json({ error: "Не удалось связаться с VK." });
  }
});

export default router;
