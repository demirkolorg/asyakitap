import { NextResponse } from "next/server"

export interface ApiSuccessResponse<T = unknown> {
    status: "success"
    data: T
    timestamp: string
}

export interface ApiErrorResponse {
    status: "error"
    code: string
    message: string
    details?: unknown
    timestamp: string
}

export interface ApiPaginatedResponse<T = unknown> {
    status: "success"
    data: T[]
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
    timestamp: string
}

// CORS headers for extension
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Extension-Id",
    "Access-Control-Max-Age": "86400",
}

export function apiSuccess<T>(data: T, status = 200): NextResponse<ApiSuccessResponse<T>> {
    return NextResponse.json(
        {
            status: "success" as const,
            data,
            timestamp: new Date().toISOString(),
        },
        { status, headers: corsHeaders }
    )
}

export function apiError(
    message: string,
    code: string,
    status = 400,
    details?: unknown
): NextResponse<ApiErrorResponse> {
    return NextResponse.json(
        {
            status: "error" as const,
            code,
            message,
            details,
            timestamp: new Date().toISOString(),
        },
        { status, headers: corsHeaders }
    )
}

export function apiPaginated<T>(
    data: T[],
    pagination: { page: number; limit: number; total: number }
): NextResponse<ApiPaginatedResponse<T>> {
    return NextResponse.json(
        {
            status: "success" as const,
            data,
            pagination: {
                ...pagination,
                totalPages: Math.ceil(pagination.total / pagination.limit),
            },
            timestamp: new Date().toISOString(),
        },
        { headers: corsHeaders }
    )
}

export function apiOptions(): NextResponse {
    return new NextResponse(null, {
        status: 204,
        headers: corsHeaders,
    })
}
