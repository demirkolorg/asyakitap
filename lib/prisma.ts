import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

// Prevent multiple instances in development
const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
    pool: Pool | undefined
}

function createPrismaClient() {
    // Use connection pooling with proper settings for serverless
    const connectionString = process.env.DATABASE_URL

    if (!connectionString) {
        throw new Error('DATABASE_URL is not defined')
    }

    // Create a connection pool with serverless-friendly settings
    const pool = new Pool({
        connectionString,
        max: 5, // Maximum connections (Supabase free tier allows ~15)
        idleTimeoutMillis: 30000, // Close idle connections after 30s
        connectionTimeoutMillis: 10000, // Connection timeout 10s
        allowExitOnIdle: true, // Allow process to exit when pool is idle
    })

    // Handle pool errors
    pool.on('error', (err: Error) => {
        console.error('Unexpected pool error:', err)
    })

    const adapter = new PrismaPg(pool)

    const client = new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === 'development'
            ? ['query', 'error', 'warn']
            : ['error'],
    })

    // Store pool reference for cleanup
    globalForPrisma.pool = pool

    return client
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

// Cache in globalThis to prevent connection pool exhaustion
if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma
}

// For production, always cache to prevent multiple pools
globalForPrisma.prisma = prisma

// Graceful shutdown
async function cleanup() {
    if (globalForPrisma.pool) {
        await globalForPrisma.pool.end()
    }
    if (globalForPrisma.prisma) {
        await globalForPrisma.prisma.$disconnect()
    }
}

// Handle process termination
if (typeof process !== 'undefined') {
    process.on('beforeExit', cleanup)
    process.on('SIGINT', async () => {
        await cleanup()
        process.exit(0)
    })
    process.on('SIGTERM', async () => {
        await cleanup()
        process.exit(0)
    })
}
