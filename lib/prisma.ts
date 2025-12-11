import { PrismaClient } from '@prisma/client'
import { Pool, PoolConfig } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

// Prevent multiple instances in development (hot reload)
const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
    pool: Pool | undefined
}

// Environment detection
const isProduction = process.env.NODE_ENV === 'production'
const isVercel = process.env.VERCEL === '1'

// Pool configuration optimized for Supabase Pooler (Supavisor)
function getPoolConfig(): PoolConfig {
    const connectionString = process.env.DATABASE_URL

    if (!connectionString) {
        throw new Error('DATABASE_URL is not defined')
    }

    // Base configuration for Supavisor transaction mode (port 6543)
    const baseConfig: PoolConfig = {
        connectionString,
        // Connection limits
        max: isVercel ? 2 : 5, // Very low for serverless, Supavisor handles the rest
        min: 0, // No minimum - allow full scale down

        // Timeouts
        idleTimeoutMillis: isVercel ? 5000 : 10000, // Close idle connections fast
        connectionTimeoutMillis: 5000, // Fail fast on connection issues

        // Serverless optimizations
        allowExitOnIdle: true,

        // Query timeout (Supavisor transaction mode)
        statement_timeout: 30000, // 30s max query time

        // Connection health
        keepAlive: true,
        keepAliveInitialDelayMillis: 10000,
    }

    return baseConfig
}

function createPrismaClient(): PrismaClient {
    const poolConfig = getPoolConfig()

    const pool = new Pool(poolConfig)

    // Pool event handlers for debugging and monitoring
    pool.on('error', (err: Error) => {
        console.error('[Prisma Pool] Unexpected error:', err.message)
    })

    pool.on('connect', () => {
        if (!isProduction) {
            console.log('[Prisma Pool] New connection established')
        }
    })

    pool.on('remove', () => {
        if (!isProduction) {
            console.log('[Prisma Pool] Connection removed')
        }
    })

    const adapter = new PrismaPg(pool)

    const client = new PrismaClient({
        adapter,
        log: isProduction
            ? ['error']
            : ['error', 'warn'],
    })

    // Graceful shutdown handler
    if (typeof process !== 'undefined') {
        const shutdown = async () => {
            console.log('[Prisma] Shutting down...')
            await client.$disconnect()
            await pool.end()
        }

        process.on('beforeExit', shutdown)
        process.on('SIGINT', shutdown)
        process.on('SIGTERM', shutdown)
    }

    globalForPrisma.pool = pool
    return client
}

// Singleton pattern - reuse existing instance
export const prisma = globalForPrisma.prisma ?? createPrismaClient()

// Cache in development to prevent hot reload issues
if (!isProduction) {
    globalForPrisma.prisma = prisma
}

// Export pool stats for monitoring
export function getPoolStats() {
    const pool = globalForPrisma.pool
    if (!pool) return null

    return {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount,
    }
}
