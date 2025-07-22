import { getUserTrackers } from "@/lib/auth"
import { getCurrentUserServer } from "@/lib/getCurrentUser"
import Link from "next/link"
import { redirect } from "next/navigation"
import CreateTrackerForm from "./CreateTrackerForm"

// Force dynamic rendering since this page requires database access
export const dynamic = "force-dynamic"

export default async function Trackers() {
    const currentUser = await getCurrentUserServer()

    if (!currentUser) {
        redirect("/login")
    }

    const trackers = await getUserTrackers(currentUser.userId)
    // No longer need to fetch users for tracker creation

    return (
        <main className="p-6 space-y-8">
            <h1 className="text-2xl font-bold">Your Trackers</h1>
            {trackers.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-gray-500 text-lg mb-4">You don&apos;t have any trackers yet.</p>
                    <p className="text-gray-400">Create your first tracker below to get started!</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Description
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Owner
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Role
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Created At
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {trackers.map((tracker) => {
                                const isOwner = tracker.ownerId === currentUser.userId
                                const participantRole = tracker.participants.find(
                                    (p) => p.userId === currentUser.userId
                                )?.role
                                return (
                                    <tr key={tracker.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {tracker.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {tracker.description || "No description"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {tracker.owner.name || tracker.owner.email}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <span
                                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                    isOwner
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-blue-100 text-blue-800"
                                                }`}
                                            >
                                                {isOwner ? "Owner" : participantRole || "Participant"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(tracker.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="flex space-x-2">
                                                <Link
                                                    href={`/trackers/${tracker.id}`}
                                                    className="text-indigo-600 hover:text-indigo-900 font-medium"
                                                >
                                                    View Flats
                                                </Link>
                                                {isOwner && (
                                                    <Link
                                                        href={`/trackers/${tracker.id}/users`}
                                                        className="text-green-600 hover:text-green-900 font-medium"
                                                    >
                                                        Manage Users
                                                    </Link>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="border-t border-gray-200 pt-8">
                <h2 className="text-xl font-bold mb-4">Create New Tracker</h2>
                <CreateTrackerForm />
            </div>
        </main>
    )
}
