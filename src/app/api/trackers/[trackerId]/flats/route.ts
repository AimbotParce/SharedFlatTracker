import { FlatStatus, PrismaClient } from "@/generated/prisma"
import { NextRequest, NextResponse } from "next/server"

const prisma = new PrismaClient()

export async function GET(request: NextRequest, { params }: { params: Promise<{ trackerId: string }> }) {
    try {
        const trackerId = parseInt((await params).trackerId)
        if (isNaN(trackerId)) {
            return NextResponse.json({ error: "Invalid tracker ID" }, { status: 400 })
        }

        const flats = await prisma.flat.findMany({
            where: { trackerId },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        })

        return NextResponse.json(flats)
    } catch (error) {
        console.error("Error fetching flats:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ trackerId: string }> }) {
    try {
        const trackerId = parseInt((await params).trackerId)
        if (isNaN(trackerId)) {
            return NextResponse.json({ error: "Invalid tracker ID" }, { status: 400 })
        }

        // Check if tracker exists
        const tracker = await prisma.tracker.findUnique({
            where: { id: trackerId },
        })

        if (!tracker) {
            return NextResponse.json({ error: "Tracker not found" }, { status: 404 })
        }

        const formData = await request.formData()
        const name = formData.get("name") as string
        const description = formData.get("description") as string
        const url = formData.get("url") as string
        const address = formData.get("address") as string
        const latitudeStr = formData.get("latitude") as string
        const longitudeStr = formData.get("longitude") as string
        const priceStr = formData.get("price") as string
        const areaStr = formData.get("area") as string
        const bedroomsStr = formData.get("bedrooms") as string
        const bathroomsStr = formData.get("bathrooms") as string
        const status = formData.get("status") as string
        const createdByIdStr = formData.get("createdById") as string

        if (!name || !status || !createdByIdStr) {
            return NextResponse.json({ error: "Name, status, and creator are required" }, { status: 400 })
        }

        // Validate status
        if (!Object.values(FlatStatus).includes(status as FlatStatus)) {
            return NextResponse.json({ error: "Invalid status value" }, { status: 400 })
        }

        const createdById = parseInt(createdByIdStr)
        if (isNaN(createdById)) {
            return NextResponse.json({ error: "Invalid creator ID" }, { status: 400 })
        }

        // Check if creator exists
        const creator = await prisma.user.findUnique({
            where: { id: createdById },
        })

        if (!creator) {
            return NextResponse.json({ error: "Creator not found" }, { status: 400 })
        }

        // Parse optional numeric fields
        const price = priceStr ? parseFloat(priceStr) : null
        const area = areaStr ? parseFloat(areaStr) : null
        const bedrooms = bedroomsStr ? parseInt(bedroomsStr) : null
        const bathrooms = bathroomsStr ? parseInt(bathroomsStr) : null
        const latitude = latitudeStr ? parseFloat(latitudeStr) : null
        const longitude = longitudeStr ? parseFloat(longitudeStr) : null

        // Extract commute times from form data
        const commuteTimes: { userId: number; timeMinutes: number | null }[] = []

        // Get all users to check for commute time fields
        const allUsers = await prisma.user.findMany({ select: { id: true } })

        for (const user of allUsers) {
            const commuteTimeStr = formData.get(`commuteTime_${user.id}`) as string
            if (commuteTimeStr && commuteTimeStr.trim() !== "") {
                const timeMinutes = parseInt(commuteTimeStr)
                if (!isNaN(timeMinutes) && timeMinutes > 0) {
                    commuteTimes.push({
                        userId: user.id,
                        timeMinutes: timeMinutes,
                    })
                }
            }
        }

        // Create the flat
        const flat = await prisma.flat.create({
            data: {
                name,
                description: description || null,
                url: url || null,
                address: address || null,
                latitude: latitude,
                longitude: longitude,
                price: price,
                area: area,
                bedrooms: bedrooms,
                bathrooms: bathrooms,
                status: status as FlatStatus,
                trackerId,
                createdById,
                commuteTimes: {
                    create: commuteTimes,
                },
            },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                commuteTimes: {
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
        })

        return NextResponse.json(flat, { status: 201 })
    } catch (error) {
        console.error("Error creating flat:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ trackerId: string }> }) {
    try {
        const trackerId = parseInt((await params).trackerId)
        if (isNaN(trackerId)) {
            return NextResponse.json({ error: "Invalid tracker ID" }, { status: 400 })
        }

        const formData = await request.formData()
        const flatIdStr = formData.get("flatId") as string

        if (!flatIdStr) {
            return NextResponse.json({ error: "Flat ID is required" }, { status: 400 })
        }

        const flatId = parseInt(flatIdStr)
        if (isNaN(flatId)) {
            return NextResponse.json({ error: "Invalid flat ID" }, { status: 400 })
        }

        // Check if flat exists and belongs to the tracker
        const existingFlat = await prisma.flat.findFirst({
            where: {
                id: flatId,
                trackerId: trackerId,
            },
        })

        if (!existingFlat) {
            return NextResponse.json({ error: "Flat not found" }, { status: 404 })
        }

        // Extract and validate fields from form data
        const name = formData.get("name") as string
        const description = formData.get("description") as string
        const url = formData.get("url") as string
        const address = formData.get("address") as string
        const priceStr = formData.get("price") as string
        const areaStr = formData.get("area") as string
        const bedroomsStr = formData.get("bedrooms") as string
        const bathroomsStr = formData.get("bathrooms") as string
        const status = formData.get("status") as string
        const createdByIdStr = formData.get("createdById") as string

        // Build update data object with only provided fields
        const updateData: {
            name?: string
            description?: string | null
            url?: string | null
            address?: string | null
            price?: number | null
            area?: number | null
            bedrooms?: number | null
            bathrooms?: number | null
            status?: FlatStatus
            createdById?: number
        } = {}

        if (name !== null && name !== undefined) {
            if (!name.trim()) {
                return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 })
            }
            updateData.name = name
        }

        if (description !== null && description !== undefined) {
            updateData.description = description || null
        }

        if (url !== null && url !== undefined) {
            updateData.url = url || null
        }

        if (address !== null && address !== undefined) {
            updateData.address = address || null
        }

        if (priceStr !== null && priceStr !== undefined) {
            if (priceStr === "") {
                updateData.price = null
            } else {
                const price = parseFloat(priceStr)
                if (isNaN(price) || price < 0) {
                    return NextResponse.json({ error: "Invalid price value" }, { status: 400 })
                }
                updateData.price = price
            }
        }

        if (areaStr !== null && areaStr !== undefined) {
            if (areaStr === "") {
                updateData.area = null
            } else {
                const area = parseFloat(areaStr)
                if (isNaN(area) || area < 0) {
                    return NextResponse.json({ error: "Invalid area value" }, { status: 400 })
                }
                updateData.area = area
            }
        }

        if (bedroomsStr !== null && bedroomsStr !== undefined) {
            if (bedroomsStr === "") {
                updateData.bedrooms = null
            } else {
                const bedrooms = parseInt(bedroomsStr)
                if (isNaN(bedrooms) || bedrooms < 0) {
                    return NextResponse.json({ error: "Invalid bedrooms value" }, { status: 400 })
                }
                updateData.bedrooms = bedrooms
            }
        }

        if (bathroomsStr !== null && bathroomsStr !== undefined) {
            if (bathroomsStr === "") {
                updateData.bathrooms = null
            } else {
                const bathrooms = parseInt(bathroomsStr)
                if (isNaN(bathrooms) || bathrooms < 0) {
                    return NextResponse.json({ error: "Invalid bathrooms value" }, { status: 400 })
                }
                updateData.bathrooms = bathrooms
            }
        }

        if (status !== null && status !== undefined) {
            if (!Object.values(FlatStatus).includes(status as FlatStatus)) {
                return NextResponse.json({ error: "Invalid status value" }, { status: 400 })
            }
            updateData.status = status as FlatStatus
        }

        if (createdByIdStr !== null && createdByIdStr !== undefined) {
            const createdById = parseInt(createdByIdStr)
            if (isNaN(createdById)) {
                return NextResponse.json({ error: "Invalid creator ID" }, { status: 400 })
            }

            // Check if creator exists
            const creator = await prisma.user.findUnique({
                where: { id: createdById },
            })

            if (!creator) {
                return NextResponse.json({ error: "Creator not found" }, { status: 400 })
            }

            updateData.createdById = createdById
        }

        // If no fields to update, return error
        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: "No fields to update" }, { status: 400 })
        }

        // Update the flat
        const updatedFlat = await prisma.flat.update({
            where: { id: flatId },
            data: updateData,
            include: {
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        })

        return NextResponse.json(updatedFlat)
    } catch (error) {
        console.error("Error updating flat:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
