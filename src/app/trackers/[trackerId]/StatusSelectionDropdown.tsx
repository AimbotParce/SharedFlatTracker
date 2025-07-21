"use client"

import { useParams, useRouter } from "next/navigation"
import { useState } from "react"

export default function StatusSelectionDropdown({
    flat_id,
    default_status,
}: {
    flat_id: number
    default_status: string
}) {
    const [currentStatus, setCurrentStatus] = useState(default_status)
    const [isUpdating, setIsUpdating] = useState(false)
    const params = useParams()
    const router = useRouter()
    const trackerId = params.trackerId as string

    const handleStatusChange = async (newStatus: string) => {
        if (newStatus === currentStatus) return

        setIsUpdating(true)

        try {
            const formData = new FormData()
            formData.append("flatId", flat_id.toString())
            formData.append("status", newStatus)

            const response = await fetch(`/api/trackers/${trackerId}/flats`, {
                method: "PUT",
                body: formData,
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || "Failed to update status")
            }

            setCurrentStatus(newStatus)
            router.refresh() // Refresh the page to show updated data
        } catch (error) {
            console.error("Error updating status:", error)
            // Reset to previous status on error
            setCurrentStatus(currentStatus)
            alert("Failed to update status. Please try again.")
        } finally {
            setIsUpdating(false)
        }
    }

    return (
        <select
            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full transition-opacity ${
                currentStatus === "Seen"
                    ? "bg-gray-100 text-gray-800"
                    : currentStatus === "Visited"
                    ? "bg-blue-100 text-blue-800"
                    : currentStatus === "VisitArranged"
                    ? "bg-yellow-100 text-yellow-800"
                    : currentStatus === "Answered"
                    ? "bg-purple-100 text-purple-800"
                    : currentStatus === "ReachedOut"
                    ? "bg-indigo-100 text-indigo-800"
                    : currentStatus === "Accepted"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
            } ${isUpdating ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            value={currentStatus}
            disabled={isUpdating}
            onChange={(e) => {
                const newStatus = e.target.value
                handleStatusChange(newStatus)
            }}
        >
            <option value="Seen">Seen</option>
            <option value="ReachedOut">Reached Out</option>
            <option value="Answered">Answered</option>
            <option value="VisitArranged">Visit Arranged</option>
            <option value="Visited">Visited</option>
            <option value="Accepted">Accepted</option>
        </select>
    )
}
