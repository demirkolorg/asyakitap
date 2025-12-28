import { createClient } from "@supabase/supabase-js"
import { apiSuccess, apiError, apiOptions } from "@/lib/api/response"

// Admin client for API authentication
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function OPTIONS() {
    return apiOptions()
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { email, password } = body

        if (!email || !password) {
            return apiError("Email ve parola gerekli", "MISSING_CREDENTIALS", 400)
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            return apiError(
                error.message === "Invalid login credentials"
                    ? "Geersiz email veya parola"
                    : error.message,
                "AUTH_FAILED",
                401
            )
        }

        if (!data.session) {
            return apiError("Oturum oluturulamad", "SESSION_ERROR", 500)
        }

        return apiSuccess({
            token: data.session.access_token,
            refreshToken: data.session.refresh_token,
            expiresAt: data.session.expires_at,
            user: {
                id: data.user.id,
                email: data.user.email,
            },
        })
    } catch (error) {
        console.error("Auth error:", error)
        return apiError("Bir hata olutu", "INTERNAL_ERROR", 500)
    }
}
