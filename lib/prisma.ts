import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

// Prevent multiple instances
const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
    pool: Pool | undefined
}

function createPrismaClient() {
    const connectionString = process.env.DATABASE_URL

    if (!connectionString) {
        throw new Error('DATABASE_URL is not defined')
    }

    // Supabase Pooler (Supavisor) optimized settings
    // Port 6543 = Transaction mode pooler
    const pool = new Pool({
        connectionString,
        max: 3, // Keep very low for serverless - Supavisor handles pooling
        min: 0, // Don't keep idle connections
        idleTimeoutMillis: 10000, // Close idle connections quickly (10s)
        connectionTimeoutMillis: 5000, // Fail fast on connection (5s)
        allowExitOnIdle: true,
        // Important for Supavisor transaction mode
        statement_timeout: 30000, // 30s query timeout
    })

    pool.on('error', (err: Error) => {
        console.error('Pool error:', err.message)
    })

    const adapter = new PrismaPg(pool)

    const client = new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    })

    globalForPrisma.pool = pool
    return client
}

// Always use cached instance
export const prisma = globalForPrisma.prisma ?? createPrismaClient()
globalForPrisma.prisma = prisma
