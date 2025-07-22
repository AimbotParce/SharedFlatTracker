import { PrismaClient } from "@/generated/prisma"
import { getCurrentUser, hashPassword } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser(request)

        if (!currentUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { id: currentUser.userId },
            select: {
                id: true,
                email: true,
                name: true,
                work_address: true,
                work_latitude: true,
                work_longitude: true,
                createdAt: true,
            },
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        return NextResponse.json({ user }, { status: 200 })
    } catch (error) {
        console.error("Profile fetch error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser(request)

        if (!currentUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { name, email, work_address, work_latitude, work_longitude, password } = await request.json()

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 })
        }

        // Check if email is already taken by another user
        const existingUser = await prisma.user.findUnique({
            where: { email },
        })

        if (existingUser && existingUser.id !== currentUser.userId) {
            return NextResponse.json({ error: "Email is already taken by another user" }, { status: 400 })
        }

        // Prepare update data
        const updateData: {
            name?: string | null
            email: string
            work_address?: string | null
            work_latitude?: number | null
            work_longitude?: number | null
            passwordHash?: string
        } = {
            email,
            name: name || null,
            work_address: work_address || null,
            work_latitude: work_latitude,
            work_longitude: work_longitude,
        }

        // Hash new password if provided
        if (password) {
            if (password.length < 6) {
                return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 })
            }
            updateData.passwordHash = await hashPassword(password)
        }

        const updatedUser = await prisma.user.update({
            where: { id: currentUser.userId },
            data: updateData,
            select: {
                id: true,
                email: true,
                name: true,
                work_address: true,
                work_latitude: true,
                work_longitude: true,
                createdAt: true,
            },
        })

        return NextResponse.json(
            {
                success: true,
                user: updatedUser,
            },
            { status: 200 }
        )
    } catch (error) {
        console.error("Profile update error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
