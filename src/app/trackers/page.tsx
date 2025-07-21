import { PrismaClient } from "@/generated/prisma"
import Link from "next/link"
import CreateTrackerForm from "./CreateTrackerForm"

const prisma = new PrismaClient()

export default async function Trackers() {
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
    const users = await prisma.user.findMany()

    return (
        <main className="p-6 space-y-8">
            <h1 className="text-2xl font-bold">Trackers</h1>
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
                            Created At
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {trackers.map((tracker) => (
                        <tr key={tracker.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tracker.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {tracker.description || "No description"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tracker.owner.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {tracker.createdAt.toString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <Link href={`/trackers/${tracker.id}`} className="text-indigo-600 font-bold">
                                    See Flats
                                </Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <br className="my-8 border-t border-gray-200" />

            <h2 className="text-xl font-bold">Create Tracker</h2>
            <CreateTrackerForm users={users} />
        </main>
    )
}
