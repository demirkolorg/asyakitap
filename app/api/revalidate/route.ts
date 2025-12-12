import { revalidateTag } from "next/cache"
import { NextRequest, NextResponse } from "next/server"

// Cache'i temizlemek için: GET /api/revalidate?tag=reading-lists
// Tüm reading list cache'lerini temizlemek için: GET /api/revalidate?all=true

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const tag = searchParams.get("tag")
    const all = searchParams.get("all")

    try {
        if (all === "true") {
            // Tüm reading list cache'lerini temizle
            revalidateTag("reading-lists")
            revalidateTag("reading-list-bilim-kurgu")
            revalidateTag("reading-list-dusunce-dava")
            revalidateTag("reading-list-tarih-medeniyet")
            revalidateTag("reading-list-ilahiyat-medeniyet")
            revalidateTag("reading-list-istihbarat-strateji")
            revalidateTag("reading-list-teknoloji-yapay-zeka")

            return NextResponse.json({
                success: true,
                message: "Tüm reading list cache'leri temizlendi",
                revalidated: true
            })
        }

        if (tag) {
            revalidateTag(tag)
            return NextResponse.json({
                success: true,
                message: `'${tag}' cache'i temizlendi`,
                revalidated: true
            })
        }

        return NextResponse.json({
            success: false,
            message: "Tag veya all parametresi gerekli. Örnek: /api/revalidate?all=true"
        }, { status: 400 })

    } catch (error) {
        return NextResponse.json({
            success: false,
            message: "Cache temizleme hatası",
            error: String(error)
        }, { status: 500 })
    }
}
