"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

interface RemoveUserButtonProps {
    trackerId: number
    participantId: number
    userName: string
}

export default function RemoveUserButton({ trackerId, participantId, userName }: RemoveUserButtonProps) {
    const [isRemoving, setIsRemoving] = useState(false)
    const router = useRouter()

    const handleRemove = async () => {
        if (!confirm(`Are you sure you want to remove ${userName} from this tracker?`)) {
            return
        }

        setIsRemoving(true)

        try {
            const response = await fetch(`/api/trackers/${trackerId}/participants?participantId=${participantId}`, {
                method: "DELETE",
            })

            if (response.ok) {
                router.refresh()
            } else {
                const data = await response.json()
                alert(data.error || "Failed to remove user")
            }
        } catch {
            alert("An unexpected error occurred")
        } finally {
            setIsRemoving(false)
        }
    }

    return (
        <button
            onClick={handleRemove}
            disabled={isRemoving}
            className="text-red-600 hover:text-red-900 font-medium disabled:opacity-50"
        >
            {isRemoving ? "Removing..." : "Remove"}
        </button>
    )
}
