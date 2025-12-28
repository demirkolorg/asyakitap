import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Only these routes are accessible without login
const publicRoutes = ['/', '/auth/callback', '/auth/auth-code-error', '/auth/extension-login', '/auth/extension-callback']

// CORS headers for API v1 (Chrome extension)
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Extension-Id",
    "Access-Control-Max-Age": "86400",
}

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname

    // Handle CORS preflight for API v1
    if (pathname.startsWith('/api/v1') && request.method === 'OPTIONS') {
        return new NextResponse(null, { status: 204, headers: corsHeaders })
    }

    // Add CORS headers to API v1 responses
    if (pathname.startsWith('/api/v1')) {
        const response = NextResponse.next()
        Object.entries(corsHeaders).forEach(([key, value]) => {
            response.headers.set(key, value)
        })
        return response
    }

    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    response = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()
    const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith('/auth/')

    // Authenticated users on landing page -> redirect to dashboard
    if (user && pathname === '/') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Unauthenticated users on protected routes -> redirect to landing
    if (!user && !isPublicRoute) {
        return NextResponse.redirect(new URL('/', request.url))
    }

    return response
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
