import { PrismaClient } from "@/generated/prisma"
import OpenInNewPage from "@/icons/OpenInNewPage"
import { getCurrentUserServer } from "@/lib/getCurrentUser"
import { redirect } from "next/navigation"
import CommuteTimeCell from "./CommuteTimeCell"
import CreateFlatForm from "./CreateFlatForm"
import FlatsMap from "./FlatsMap"
import StatusSelectionDropdown from "./StatusSelectionDropdown"

const prisma = new PrismaClient()

// Force dynamic rendering since this page requires database access
export const dynamic = "force-dynamic"

export default async function TrackerFlats({ params }: { params: Promise<{ trackerId: string }> }) {
    const currentUser = await getCurrentUserServer()

    if (!currentUser) {
        redirect("/login")
    }

    const trackerId = parseInt((await params).trackerId)

    if (isNaN(trackerId)) {
        return <div>Invalid tracker ID</div>
    }

    const tracker = await prisma.tracker.findUnique({
        where: { id: trackerId },
        include: {
            owner: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    work_latitude: true,
                    work_longitude: true,
                    work_address: true,
                },
            },
            participants: {
                where: {
                    userId: currentUser.userId,
                },
            },
        },
    })

    if (!tracker) {
        return (
            <div className="p-6">
                <div className="text-red-600">Tracker not found</div>
            </div>
        )
    }

    // Check if user has access to this tracker
    const hasAccess = tracker.ownerId === currentUser.userId || tracker.participants.length > 0

    if (!hasAccess) {
        return (
            <div className="p-6">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    <h2 className="font-bold">Access Denied</h2>
                    <p>You don&apos;t have permission to view this tracker.</p>
                </div>
            </div>
        )
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
        orderBy: { createdAt: "desc" },
    })

    // Get only users that participate in this tracker (owner + participants)
    const trackerParticipants = await prisma.trackerParticipant.findMany({
        where: { trackerId },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    work_latitude: true,
                    work_longitude: true,
                    work_address: true,
                },
            },
        },
    })

    // Create users array with owner + participants
    const users = [
        // Owner
        {
            id: tracker.owner.id,
            name: tracker.owner.name,
            email: tracker.owner.email,
            workLatitude: tracker.owner.work_latitude,
            workLongitude: tracker.owner.work_longitude,
            workAddress: tracker.owner.work_address,
        },
        // Participants (excluding owner if they're also a participant)
        ...trackerParticipants
            .filter((p) => p.userId !== tracker.owner.id)
            .map((p) => ({
                id: p.user.id,
                name: p.user.name,
                email: p.user.email,
                workLatitude: p.user.work_latitude,
                workLongitude: p.user.work_longitude,
                workAddress: p.user.work_address,
            })),
    ]

    return (
        <main className="p-6 space-y-8">
            <div>
                <h1 className="text-2xl font-bold">{tracker.name}</h1>
                <p className="text-gray-600">{tracker.description || "No description"}</p>
                <p className="text-sm text-gray-500">Owner: {tracker.owner.name}</p>
            </div>

            {/* Flats Map */}
            <div>
                <h2 className="text-xl font-bold mb-4">Flats & Work Locations</h2>
                <FlatsMap flats={flats} users={users} />
            </div>

            <div>
                <h2 className="text-xl font-bold">Flats ({flats.length})</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Address
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Price
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Area
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Rooms
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Avg Commute
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Added By
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Created At
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {flats.map((flat) => (
                                <tr key={flat.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {flat.url ? (
                                            <div className="flex items-center gap-1">
                                                <a
                                                    href={flat.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-800"
                                                >
                                                    {flat.name || "Unnamed Flat"}
                                                </a>
                                                <OpenInNewPage className="w-3 h-3 text-blue-600" />
                                            </div>
                                        ) : (
                                            flat.name || "Unnamed Flat"
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {flat.address || "No address"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {flat.price ? `€${flat.price.toLocaleString()}` : "N/A"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <StatusSelectionDropdown flat_id={flat.id} default_status={flat.status} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {flat.area ? `${flat.area} m²` : "N/A"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {flat.bedrooms || flat.bathrooms
                                            ? `${flat.bedrooms || 0}bed / ${flat.bathrooms || 0}bath`
                                            : "N/A"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <CommuteTimeCell commuteTimes={flat.commuteTimes} users={users} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {flat.createdBy.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(flat.createdAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {flats.length === 0 && (
                        <div className="text-center py-8 text-gray-500">No flats found in this tracker.</div>
                    )}
                </div>
            </div>

            <hr className="my-8 border-t border-gray-200" />

            <div>
                <h2 className="text-xl font-bold">Add New Flat</h2>
                <CreateFlatForm trackerId={trackerId} users={users} />
            </div>
        </main>
    )
}
