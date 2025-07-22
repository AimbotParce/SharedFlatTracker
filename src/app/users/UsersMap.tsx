"use client"

import { User } from "@/generated/prisma"
import LeafletMap from "./LeafletMap"

interface UsersMapProps {
    users: User[]
}

export default function UsersMap({ users }: UsersMapProps) {
    const usersWithAddresses = users.filter((user) => user.work_address && user.work_address.trim() !== "")

    if (usersWithAddresses.length === 0) {
        return (
            <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                <div className="text-center">
                    <div className="text-gray-500 text-lg mb-2">No work addresses available</div>
                    <div className="text-gray-400 text-sm">Add work addresses to users to see them on the map</div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <LeafletMap users={users} />
        </div>
    )
}
