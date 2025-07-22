import { PrismaClient } from "@/generated/prisma"
import { getCurrentUser } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"

const prisma = new PrismaClient()

export async function GET() {
    try {
        const trackers = await prisma.tracker.findMany({
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        })

        return NextResponse.json(trackers)
    } catch (error) {
        console.error("Error fetching trackers:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser(request)

        if (!currentUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const formData = await request.formData()
        const name = formData.get("name") as string
        const description = formData.get("description") as string

        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 })
        }

        // Create the tracker with the current user as owner
        const tracker = await prisma.tracker.create({
            data: {
                name,
                description: description || null,
                ownerId: currentUser.userId,
            },
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        })

        return NextResponse.json(tracker, { status: 201 })
    } catch (error) {
        console.error("Error creating tracker:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
