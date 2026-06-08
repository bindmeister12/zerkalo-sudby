import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, appSettingsTable } from "@workspace/db";

const router: ReturnType<typeof Router> = Router();

router.get("/", async (_req, res) => {
  const rows = await db
    .select()
    .from(appSettingsTable)
    .where(eq(appSettingsTable.key, "subscriptions_enabled"));

  const subscriptionsEnabled = rows[0]?.value === "true";

  res.json({ subscriptionsEnabled });
});

export default router;
