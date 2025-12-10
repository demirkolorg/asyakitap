import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/dashboard'

    if (code) {
        try {
            const supabase = await createClient()
            const { error, data: { user } } = await supabase.auth.exchangeCodeForSession(code)

            if (error) {
                console.error("Auth exchange error:", error)
                return NextResponse.redirect(`${origin}/auth/auth-code-error?error=exchange_failed`)
            }

            if (user && user.email) {
                // Sync user to Prisma - wrap in try-catch to not block login
                try {
                    await prisma.user.upsert({
                        where: { email: user.email },
                        update: { updatedAt: new Date() },
                        create: {
                            id: user.id,
                            email: user.email,
                        },
                    })
                } catch (dbError) {
                    // Log but don't block - user can still use the app
                    console.error("Failed to sync user to Prisma:", dbError)
                }

                const forwardedHost = request.headers.get('x-forwarded-host')
                const isLocalEnv = process.env.NODE_ENV === 'development'

                if (isLocalEnv) {
                    return NextResponse.redirect(`${origin}${next}`)
                } else if (forwardedHost) {
                    return NextResponse.redirect(`https://${forwardedHost}${next}`)
                } else {
                    return NextResponse.redirect(`${origin}${next}`)
                }
            }
        } catch (err) {
            console.error("Auth callback error:", err)
            return NextResponse.redirect(`${origin}/auth/auth-code-error?error=unknown`)
        }
    }

    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=no_code`)
}
