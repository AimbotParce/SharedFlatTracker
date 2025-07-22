import { PrismaClient } from "@/generated/prisma"
import bcrypt from "bcryptjs"
import { NextRequest, NextResponse } from "next/server"

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const email = formData.get("email") as string
        const name = formData.get("name") as string
        const password = formData.get("password") as string
        const work_address = formData.get("work_address") as string

        if (!email || !name || !password) {
            return NextResponse.json({ error: "Email, name, and password are required" }, { status: 400 })
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        })

        if (existingUser) {
            return NextResponse.json({ error: "User with this email already exists" }, { status: 400 })
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 12)

        // Create the user
        const user = await prisma.user.create({
            data: {
                email,
                name,
                passwordHash: hashedPassword,
                work_address: work_address || null,
            },
        })

        // Return success response (don't include password hash)
        const userResponse = {
            id: user.id,
            email: user.email,
            name: user.name,
            work_address: user.work_address,
            createdAt: user.createdAt,
        }
        return NextResponse.json(userResponse, { status: 201 })
    } catch (error) {
        console.error("Error creating user:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
