import { PrismaClient } from "@/generated/prisma"
import CreateUserForm from "./CreateUserForm"

const prisma = new PrismaClient()

// Force dynamic rendering since this page requires database access
export const dynamic = 'force-dynamic'

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
                            Created At
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user) => (
                        <tr key={user.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {user.createdAt.toString()}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <br className="my-8 border-t border-gray-200" />

            <h2 className="text-xl font-bold">Create User</h2>
            <CreateUserForm />
        </main>
    )
}
