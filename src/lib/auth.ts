import { PrismaClient } from "@/generated/prisma"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { NextRequest } from "next/server"

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production"

export interface UserPayload {
    userId: number
    email: string
    name: string | null
}

export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword)
}

export function generateToken(payload: UserPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" })
}

export function verifyToken(token: string): UserPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as UserPayload
    } catch {
        return null
    }
}

export async function getCurrentUser(request: NextRequest): Promise<UserPayload | null> {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
        return null
    }

    const payload = verifyToken(token)
    if (!payload) {
        return null
    }

    // Verify user still exists in database
    const user = await prisma.user.findUnique({
        where: { id: payload.userId },
    })

    if (!user) {
        return null
    }

    return payload
}

export async function getUserTrackers(userId: number) {
    return prisma.tracker.findMany({
        where: {
            OR: [
                { ownerId: userId }, // User owns the tracker
                {
                    participants: {
                        some: {
                            userId: userId,
                        },
                    },
                }, // User is a participant
            ],
        },
        include: {
            owner: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            participants: {
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    })
}
