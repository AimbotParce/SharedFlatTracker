import { PrismaClient } from "@/generated/prisma"
import { getCurrentUser } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"

const prisma = new PrismaClient()

export async function POST(request: NextRequest, { params }: { params: Promise<{ trackerId: string }> }) {
    try {
        const currentUser = await getCurrentUser(request)

        if (!currentUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const trackerId = parseInt((await params).trackerId)

        if (isNaN(trackerId)) {
            return NextResponse.json({ error: "Invalid tracker ID" }, { status: 400 })
        }

        // Check if current user is the owner of the tracker
        const tracker = await prisma.tracker.findUnique({
            where: { id: trackerId },
            select: { ownerId: true },
        })

        if (!tracker) {
            return NextResponse.json({ error: "Tracker not found" }, { status: 404 })
        }

        if (tracker.ownerId !== currentUser.userId) {
            return NextResponse.json({ error: "Only the tracker owner can add participants" }, { status: 403 })
        }

        const formData = await request.formData()
        const userIdStr = formData.get("userId") as string
        const role = formData.get("role") as string

        if (!userIdStr || !role) {
            return NextResponse.json({ error: "User ID and role are required" }, { status: 400 })
        }

        const userId = parseInt(userIdStr)
        if (isNaN(userId)) {
            return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
        }

        // Validate role
        if (!["Admin", "Participant"].includes(role)) {
            return NextResponse.json({ error: "Invalid role. Must be Admin or Participant" }, { status: 400 })
        }

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { id: userId },
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // Check if user is already a participant
        const existingParticipant = await prisma.trackerParticipant.findFirst({
            where: {
                trackerId: trackerId,
                userId: userId,
            },
        })

        if (existingParticipant) {
            return NextResponse.json({ error: "User is already a participant in this tracker" }, { status: 400 })
        }

        // Check if user is the owner
        if (userId === tracker.ownerId) {
            return NextResponse.json({ error: "Cannot add the owner as a participant" }, { status: 400 })
        }

        // Add user as participant
        const participant = await prisma.trackerParticipant.create({
            data: {
                trackerId: trackerId,
                userId: userId,
                role: role as "Admin" | "Participant",
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        })

        return NextResponse.json(participant, { status: 201 })
    } catch (error) {
        console.error("Error adding participant to tracker:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// GET endpoint to list participants (optional, for future use)
export async function GET(request: NextRequest, { params }: { params: Promise<{ trackerId: string }> }) {
    try {
        const currentUser = await getCurrentUser(request)

        if (!currentUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const trackerId = parseInt((await params).trackerId)

        if (isNaN(trackerId)) {
            return NextResponse.json({ error: "Invalid tracker ID" }, { status: 400 })
        }

        // Check if user has access to this tracker
        const tracker = await prisma.tracker.findUnique({
            where: { id: trackerId },
            include: {
                participants: {
                    where: { userId: currentUser.userId },
                },
            },
        })

        if (!tracker) {
            return NextResponse.json({ error: "Tracker not found" }, { status: 404 })
        }

        const hasAccess = tracker.ownerId === currentUser.userId || tracker.participants.length > 0

        if (!hasAccess) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 })
        }

        // Get all participants
        const participants = await prisma.trackerParticipant.findMany({
            where: { trackerId: trackerId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        work_address: true,
                        work_latitude: true,
                        work_longitude: true,
                    },
                },
            },
        })

        return NextResponse.json(participants)
    } catch (error) {
        console.error("Error fetching tracker participants:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// DELETE endpoint to remove a participant
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ trackerId: string }> }) {
    try {
        const currentUser = await getCurrentUser(request)

        if (!currentUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const trackerId = parseInt((await params).trackerId)

        if (isNaN(trackerId)) {
            return NextResponse.json({ error: "Invalid tracker ID" }, { status: 400 })
        }

        // Check if current user is the owner of the tracker
        const tracker = await prisma.tracker.findUnique({
            where: { id: trackerId },
            select: { ownerId: true },
        })

        if (!tracker) {
            return NextResponse.json({ error: "Tracker not found" }, { status: 404 })
        }

        if (tracker.ownerId !== currentUser.userId) {
            return NextResponse.json({ error: "Only the tracker owner can remove participants" }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const participantIdStr = searchParams.get("participantId")

        if (!participantIdStr) {
            return NextResponse.json({ error: "Participant ID is required" }, { status: 400 })
        }

        const participantId = parseInt(participantIdStr)
        if (isNaN(participantId)) {
            return NextResponse.json({ error: "Invalid participant ID" }, { status: 400 })
        }

        // Check if participant exists and belongs to this tracker
        const participant = await prisma.trackerParticipant.findUnique({
            where: { id: participantId },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
        })

        if (!participant || participant.trackerId !== trackerId) {
            return NextResponse.json({ error: "Participant not found" }, { status: 404 })
        }

        // Delete the participant
        await prisma.trackerParticipant.delete({
            where: { id: participantId },
        })

        return NextResponse.json(
            {
                success: true,
                message: `${participant.user.name || participant.user.email} has been removed from the tracker`,
            },
            { status: 200 }
        )
    } catch (error) {
        console.error("Error removing participant from tracker:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
