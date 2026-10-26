import { PrismaClient } from "@prisma/client";
import { db as jsonDb } from "./repository";

// Declare global Prisma instance to prevent multiple client instances in development hot-reloading
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Export repository interface
export const db = jsonDb;
export default db;
