"use server"

export interface GoogleBook {
    id: string
    volumeInfo: {
        title: string
        authors?: string[]
        description?: string
        pageCount?: number
        imageLinks?: {
            smallThumbnail?: string
            thumbnail?: string
        }
        publishedDate?: string
        industryIdentifiers?: Array<{
            type: string
            identifier: string
        }>
    }
}

function isISBN(query: string): boolean {
    // Remove hyphens and spaces
    const cleaned = query.replace(/[-\s]/g, '')
    // ISBN-10: 10 digits (last can be X)
    // ISBN-13: 13 digits starting with 978 or 979
    return /^(\d{10}|\d{9}X|\d{13})$/i.test(cleaned)
}

export async function searchGoogleBooks(query: string): Promise<GoogleBook[]> {
    if (!query) return []

    try {
        // Format query for ISBN search
        let searchQuery = query.trim()
        if (isISBN(searchQuery)) {
            // Clean ISBN and use isbn: prefix
            const cleanedISBN = searchQuery.replace(/[-\s]/g, '')
            searchQuery = `isbn:${cleanedISBN}`
        }

        const res = await fetch(
            `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
                searchQuery
            )}&maxResults=10&printType=books`,
            { cache: 'no-store' }
        )

        if (!res.ok) {
            throw new Error("Google Books API error")
        }

        const data = await res.json()
        return data.items || []
    } catch (error) {
        console.error("Failed to search books:", error)
        return []
    }
}
