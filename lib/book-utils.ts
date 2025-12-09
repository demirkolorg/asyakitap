import type { GoogleBook } from "@/actions/google-books"

export function getBestCoverUrl(book: GoogleBook): string | undefined {
    // Try Google Books thumbnail first
    const googleCover = book.volumeInfo.imageLinks?.thumbnail ||
                        book.volumeInfo.imageLinks?.smallThumbnail

    if (googleCover) {
        // Upgrade to higher quality by changing zoom parameter
        return googleCover
            .replace('http:', 'https:')
            .replace('zoom=1', 'zoom=2')
            .replace('&edge=curl', '') // Remove curl effect
    }

    // Fallback to Open Library using ISBN
    const isbn = book.volumeInfo.industryIdentifiers?.find(
        id => id.type === 'ISBN_13' || id.type === 'ISBN_10'
    )?.identifier

    if (isbn) {
        return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`
    }

    return undefined
}
