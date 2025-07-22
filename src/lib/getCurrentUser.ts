import { getCurrentUser, UserPayload } from "@/lib/auth"
import { headers } from "next/headers"
import { NextRequest } from "next/server"

// Server component to get current user
export async function getCurrentUserServer(): Promise<UserPayload | null> {
    try {
        const headersList = await headers()
        const cookie = headersList.get("cookie")

        if (!cookie) return null

        // Parse cookies manually since we're on the server
        const authToken = cookie
            .split("; ")
            .find((row) => row.startsWith("auth-token="))
            ?.split("=")[1]

        if (!authToken) return null

        // Create a mock request to use getCurrentUser
        const mockRequest = {
            cookies: {
                get: (name: string) => (name === "auth-token" ? { value: authToken } : undefined),
            },
        } as NextRequest

        return await getCurrentUser(mockRequest)
    } catch {
        return null
    }
}
