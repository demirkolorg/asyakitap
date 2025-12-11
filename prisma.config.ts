import { defineConfig } from "prisma/config";

// Use process.env directly - Vercel provides env vars during build
const databaseUrl = process.env.DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  // Only set datasource if DATABASE_URL is available
  // For prisma generate, the client can work without the actual URL
  ...(databaseUrl ? { datasource: { url: databaseUrl } } : {}),
});
