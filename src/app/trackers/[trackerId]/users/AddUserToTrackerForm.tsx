"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

interface User {
    id: number
    name: string | null
    email: string
}

interface AddUserToTrackerFormProps {
    trackerId: number
    availableUsers: User[]
}

export default function AddUserToTrackerForm({ trackerId, availableUsers }: AddUserToTrackerFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")
        setSuccess("")

        const formData = new FormData(e.currentTarget)

        try {
            const response = await fetch(`/api/trackers/${trackerId}/participants`, {
                method: "POST",
                body: formData,
            })

            const data = await response.json()

            if (response.ok) {
                setSuccess("User added to tracker successfully!")
                // e.currentTarget.reset()
                router.refresh()
            } else {
                setError(data.error || "Failed to add user to tracker")
            }
        } catch {
            setError("An unexpected error occurred")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}
            {success && (
                <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded">{success}</div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="userId" className="block text-sm font-medium text-gray-700">
                        Select User *
                    </label>
                    <select
                        id="userId"
                        name="userId"
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="">Select a user to add</option>
                        {availableUsers.map((user) => (
                            <option key={user.id} value={user.id}>
                                {user.name ? `${user.name} (${user.email})` : user.email}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                        Role *
                    </label>
                    <select
                        id="role"
                        name="role"
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="">Select a role</option>
                        <option value="Participant">Participant</option>
                        <option value="Admin">Admin</option>
                    </select>
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-indigo-600 text-white py-2 px-6 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? "Adding..." : "Add User"}
                </button>
            </div>
        </form>
    )
}
