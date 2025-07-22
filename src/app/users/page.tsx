import { PrismaClient } from "@/generated/prisma"
import OpenInNewPage from "@/icons/OpenInNewPage"
import CreateUserForm from "./CreateUserForm"
import UsersMap from "./UsersMap"

const prisma = new PrismaClient()

// Force dynamic rendering since this page requires database access
export const dynamic = "force-dynamic"

export default async function Users() {
    const users = await prisma.user.findMany()
    return (
        <main className="p-6 space-y-8">
            <h1 className="text-2xl font-bold">Users</h1>
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
                            Work Address
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Coordinates
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Created At
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user) => (
                        <tr key={user.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex justify-between items-center">
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
                                        View on Google Maps <OpenInNewPage className="w-3 h-3" />
                                    </a>
                                )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {user.work_latitude && user.work_longitude
                                    ? `${parseFloat(user.work_latitude.toString()).toFixed(6)}, ${parseFloat(
                                          user.work_longitude.toString()
                                      ).toFixed(6)}`
                                    : "Not available"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {user.createdAt.toString()}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <h2 className="text-xl font-bold mt-8">User Locations Map</h2>
            <UsersMap users={users} />

            <br className="my-8 border-t border-gray-200" />

            <h2 className="text-xl font-bold">Create User</h2>
            <CreateUserForm />
        </main>
    )
}
