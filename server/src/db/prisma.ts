import { PrismaClient } from "@prisma/client";
import { existsSync, readFileSync } from "fs";
import path from "path";

declare global {
  // eslint-disable-next-line no-var
  var __normativityPrisma: PrismaClient | undefined;
}

export const isDatabaseConfigured = (): boolean => {
  return Boolean(process.env.DATABASE_URL);
};

const loadLocalEnv = (): void => {
  const envPath = path.resolve(__dirname, "../../.env");
  if (!existsSync(envPath)) return;
  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const key = match[1];
    if (process.env[key]) continue;
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
};

loadLocalEnv();

export const prisma = global.__normativityPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.__normativityPrisma = prisma;
}
