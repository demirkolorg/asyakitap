import { createClient } from "@supabase/supabase-js"
import { apiSuccess, apiError, apiOptions } from "@/lib/api/response"

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function OPTIONS() {
    return apiOptions()
}

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get("Authorization")

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return apiError("Token gerekli", "MISSING_TOKEN", 401)
        }

        const token = authHeader.replace("Bearer ", "")

        const { data, error } = await supabase.auth.getUser(token)

        if (error || !data.user) {
            return apiError("Geersiz veya süresi dolmu token", "INVALID_TOKEN", 401)
        }

        return apiSuccess({
            valid: true,
            user: {
                id: data.user.id,
                email: data.user.email,
            },
        })
    } catch (error) {
        console.error("Token verify error:", error)
        return apiError("Bir hata olutu", "INTERNAL_ERROR", 500)
    }
}
