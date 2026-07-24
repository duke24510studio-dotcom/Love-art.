import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set.");
  }
  // keepAlive: without it, a pooled connection left idle during a long
  // upstream call (e.g. a 60-90s OpenAI image generation request) gets
  // silently dropped somewhere between here and Render's Postgres, and the
  // next query on it fails with "Connection terminated unexpectedly".
  const adapter = new PrismaPg({ connectionString, keepAlive: true });
  return new PrismaClient({ adapter } as never);
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (!globalForPrisma.prisma) globalForPrisma.prisma = prisma;
