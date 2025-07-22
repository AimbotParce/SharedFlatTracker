import { PrismaClient } from "@/generated/prisma"
import { getCurrentUserServer } from "@/lib/getCurrentUser"
import { redirect } from "next/navigation"
import UserProfileForm from "./UserProfileForm"

const prisma = new PrismaClient()

// Force dynamic rendering since this page requires database access
export const dynamic = "force-dynamic"

export default async function UserProfilePage() {
    const currentUser = await getCurrentUserServer()

    if (!currentUser) {
        redirect("/login")
    }

    const user = await prisma.user.findUnique({
        where: { id: currentUser.userId },
        select: {
            id: true,
            email: true,
            name: true,
            work_address: true,
            work_latitude: true,
            work_longitude: true,
            createdAt: true,
        },
    })

    if (!user) {
        redirect("/login")
    }

    return (
        <main className="p-6 max-w-2xl mx-auto space-y-8">
            <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
                    <p className="text-sm text-gray-600 mt-1">Update your personal information and work location</p>
                </div>
                <div className="p-6">
                    <UserProfileForm user={user} />
                </div>
            </div>
        </main>
    )
}
