import { PrismaClient } from "@/generated/prisma"
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
        const formData = await request.formData()
        const name = formData.get("name") as string
        const description = formData.get("description") as string
        const ownerIdStr = formData.get("ownerId") as string

        if (!name || !ownerIdStr) {
            return NextResponse.json({ error: "Name and owner are required" }, { status: 400 })
        }

        const ownerId = parseInt(ownerIdStr)
        if (isNaN(ownerId)) {
            return NextResponse.json({ error: "Invalid owner ID" }, { status: 400 })
        }

        // Check if the owner exists
        const owner = await prisma.user.findUnique({
            where: { id: ownerId },
        })

        if (!owner) {
            return NextResponse.json({ error: "Owner not found" }, { status: 400 })
        }

        // Create the tracker
        const tracker = await prisma.tracker.create({
            data: {
                name,
                description: description || null,
                ownerId,
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
