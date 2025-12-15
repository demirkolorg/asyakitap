import { unstable_cache } from 'next/cache'

// Cache tags for granular invalidation
export const CACHE_TAGS = {
    // User-specific
    userBooks: (userId: string) => `user-books-${userId}`,
    userStats: (userId: string) => `user-stats-${userId}`,
    userQuotes: (userId: string) => `user-quotes-${userId}`,
    userAuthors: (userId: string) => `user-authors-${userId}`,
    userReadingListLinks: (userId: string) => `user-rl-links-${userId}`,
    userChallengeLinks: (userId: string) => `user-challenge-links-${userId}`,

    // Global (shared across users)
    readingLists: 'reading-lists',
    readingList: (slug: string) => `reading-list-${slug}`,
    authors: 'authors',
    publishers: 'publishers',
    challenges: 'challenges',
    challenge: (year: number) => `challenge-${year}`,

    // Specific entities
    book: (id: string) => `book-${id}`,
    author: (id: string) => `author-${id}`,
    publisher: (id: string) => `publisher-${id}`,

    // Book relationships
    bookReadingLists: (bookId: string) => `book-${bookId}-reading-lists`,
    bookChallenge: (bookId: string) => `book-${bookId}-challenge`,
} as const

// Cache durations in seconds
export const CACHE_DURATION = {
    SHORT: 60, // 1 minute - for frequently changing data
    MEDIUM: 300, // 5 minutes - for user-specific data
    LONG: 3600, // 1 hour - for rarely changing data
    STATIC: 86400, // 24 hours - for near-static data like reading lists
} as const

// Helper to create cached functions with consistent configuration
export function createCachedFunction<T extends (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>>>(
    fn: T,
    keyParts: string[],
    options: {
        tags?: string[]
        revalidate?: number
    } = {}
) {
    return unstable_cache(
        fn,
        keyParts,
        {
            tags: options.tags,
            revalidate: options.revalidate ?? CACHE_DURATION.MEDIUM,
        }
    )
}

// Utility to generate cache key from function arguments
export function generateCacheKey(prefix: string, ...args: (string | number | undefined)[]): string[] {
    return [prefix, ...args.filter(Boolean).map(String)]
}

import { revalidateTag } from 'next/cache'

/**
 * Kitap bağlantılarıyla ilgili tüm cache'leri invalidate et
 */
export function invalidateLinkCaches(userId: string, bookId?: string) {
    revalidateTag(CACHE_TAGS.userBooks(userId), 'max')
    revalidateTag(CACHE_TAGS.userReadingListLinks(userId), 'max')
    revalidateTag(CACHE_TAGS.userChallengeLinks(userId), 'max')
    revalidateTag(CACHE_TAGS.userStats(userId), 'max')

    if (bookId) {
        revalidateTag(CACHE_TAGS.book(bookId), 'max')
        revalidateTag(CACHE_TAGS.bookReadingLists(bookId), 'max')
        revalidateTag(CACHE_TAGS.bookChallenge(bookId), 'max')
    }
}

/**
 * Tüm kitap ve bağlantı cache'lerini agresif olarak temizle
 */
export function invalidateAllBookRelatedCaches(userId: string) {
    revalidateTag(CACHE_TAGS.userBooks(userId), 'max')
    revalidateTag(CACHE_TAGS.userStats(userId), 'max')
    revalidateTag(CACHE_TAGS.userReadingListLinks(userId), 'max')
    revalidateTag(CACHE_TAGS.userChallengeLinks(userId), 'max')
    revalidateTag(CACHE_TAGS.userAuthors(userId), 'max')
    revalidateTag(CACHE_TAGS.readingLists, 'max')
    revalidateTag(CACHE_TAGS.challenges, 'max')
}
