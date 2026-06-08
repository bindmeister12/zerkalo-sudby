import { boolean, integer, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const userPersonalDataTable = pgTable(
  "user_personal_data",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    email: text("email"),
    phone: text("phone"),
    city: text("city"),
    marketingConsent: boolean("marketing_consent").notNull().default(false),
    personalizationConsent: boolean("personalization_consent").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("user_personal_data_user_id_unique_idx").on(table.userId)],
);

export const consentRecordsTable = pgTable("consent_records", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  policyVersion: text("policy_version").notNull(),
  marketingConsent: boolean("marketing_consent").notNull().default(false),
  personalizationConsent: boolean("personalization_consent").notNull().default(false),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }).notNull().defaultNow(),
  ip: text("ip"),
  userAgent: text("user_agent"),
});

export type UserPersonalData = typeof userPersonalDataTable.$inferSelect;
export type ConsentRecord = typeof consentRecordsTable.$inferSelect;
