import { PrismaClient } from "@/generated/prisma"
import OpenInNewPage from "@/icons/OpenInNewPage"
import { getCurrentUserServer } from "@/lib/getCurrentUser"
import Link from "next/link"
import { redirect } from "next/navigation"
import AddUserToTrackerForm from "./AddUserToTrackerForm"
import RemoveUserButton from "./RemoveUserButton"
import TrackerUsersMap from "./TrackerUsersMap"

const prisma = new PrismaClient()

// Force dynamic rendering since this page requires database access
export const dynamic = "force-dynamic"

export default async function TrackerUsersPage({ params }: { params: Promise<{ trackerId: string }> }) {
    const currentUser = await getCurrentUserServer()

    if (!currentUser) {
        redirect("/login")
    }

    const trackerId = parseInt((await params).trackerId)

    if (isNaN(trackerId)) {
        return (
            <div className="p-6">
                <div className="text-red-600">Invalid tracker ID</div>
            </div>
        )
    }

    const tracker = await prisma.tracker.findUnique({
        where: { id: trackerId },
        include: {
            owner: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    work_address: true,
                    work_latitude: true,
                    work_longitude: true,
                },
            },
            participants: {
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            work_address: true,
                            work_latitude: true,
                            work_longitude: true,
                            createdAt: true,
                        },
                    },
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
    const hasAccess =
        tracker.ownerId === currentUser.userId || tracker.participants.some((p) => p.userId === currentUser.userId)
    const isOwner = tracker.ownerId === currentUser.userId

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

    // Only owners can manage users
    if (!isOwner) {
        return (
            <div className="p-6">
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
                    <h2 className="font-bold">Access Denied</h2>
                    <p>Only the tracker owner can manage users.</p>
                    <Link href={`/trackers/${trackerId}`} className="text-blue-600 hover:text-blue-800 underline">
                        Go back to tracker
                    </Link>
                </div>
            </div>
        )
    }

    // Get all users not in the tracker for the add user form
    const availableUsers = await prisma.user.findMany({
        where: {
            AND: [
                { id: { not: tracker.ownerId } }, // Exclude owner
                {
                    NOT: {
                        trackerParticipations: {
                            some: {
                                trackerId: trackerId,
                            },
                        },
                    },
                },
            ],
        },
        select: {
            id: true,
            name: true,
            email: true,
        },
    })

    // Combine owner and participants for display
    const allTrackerUsers = [
        {
            id: tracker.owner.id,
            name: tracker.owner.name,
            email: tracker.owner.email,
            work_address: tracker.owner.work_address,
            work_latitude: tracker.owner.work_latitude,
            work_longitude: tracker.owner.work_longitude,
            role: "Owner" as const,
            isOwner: true,
            participantId: null,
        },
        ...tracker.participants.map((p) => ({
            id: p.user.id,
            name: p.user.name,
            email: p.user.email,
            work_address: p.user.work_address,
            work_latitude: p.user.work_latitude,
            work_longitude: p.user.work_longitude,
            role: p.role,
            isOwner: false,
            participantId: p.id,
        })),
    ]

    return (
        <main className="p-6 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Users in &quot;{tracker.name}&quot;</h1>
                    <p className="text-gray-600 mt-1">Manage users and their roles in this tracker</p>
                </div>
                <Link
                    href={`/trackers/${trackerId}`}
                    className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                    Back to Tracker
                </Link>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Role
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Work Address
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Coordinates
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {allTrackerUsers.map((user) => (
                            <tr key={`${user.isOwner ? "owner" : "participant"}-${user.id}`}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {user.name || user.email}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <span
                                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                            user.isOwner
                                                ? "bg-green-100 text-green-800"
                                                : user.role === "Admin"
                                                ? "bg-purple-100 text-purple-800"
                                                : "bg-blue-100 text-blue-800"
                                        }`}
                                    >
                                        {user.isOwner ? "Owner" : user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <div className="flex justify-between items-center">
                                        {user.work_address || "Not specified"}
                                        {user.work_address && (
                                            <a
                                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                                    user.work_address || ""
                                                )}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-800 text-sm underline flex items-center"
                                            >
                                                View <OpenInNewPage className="w-3 h-3 ml-1" />
                                            </a>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {user.work_latitude && user.work_longitude
                                        ? `${parseFloat(user.work_latitude.toString()).toFixed(6)}, ${parseFloat(
                                              user.work_longitude.toString()
                                          ).toFixed(6)}`
                                        : "Not available"}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {!user.isOwner && user.participantId && (
                                        <RemoveUserButton
                                            trackerId={trackerId}
                                            participantId={user.participantId}
                                            userName={user.name || user.email}
                                        />
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <h2 className="text-xl font-bold mt-8">User Locations Map</h2>
            <TrackerUsersMap users={allTrackerUsers.filter((u) => u.work_latitude && u.work_longitude)} />

            <div className="border-t border-gray-200 pt-8">
                <h2 className="text-xl font-bold mb-4">Add User to Tracker</h2>
                {availableUsers.length > 0 ? (
                    <AddUserToTrackerForm trackerId={trackerId} availableUsers={availableUsers} />
                ) : (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <p className="text-gray-600">All users are already part of this tracker.</p>
                    </div>
                )}
            </div>
        </main>
    )
}
