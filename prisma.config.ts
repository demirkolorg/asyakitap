import { defineConfig, env } from "prisma/config";
import * as dotenv from 'dotenv';
import path from 'path';

// Ensure we are loading from the project root
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
