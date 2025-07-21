"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

interface User {
    id: number
    name: string | null
    email: string
}

interface CreateFlatFormProps {
    trackerId: number
    users: User[]
}

export default function CreateFlatForm({ trackerId, users }: CreateFlatFormProps) {
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
            const response = await fetch(`/api/trackers/${trackerId}/flats`, {
                method: "POST",
                body: formData,
            })

            const data = await response.json()

            if (response.ok) {
                setSuccess("Flat added successfully!")
                e.currentTarget.reset()
                router.refresh()
            } else {
                setError(data.error || "Failed to add flat")
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
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Flat Name *
                    </label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter flat name"
                    />
                </div>

                <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                        Address
                    </label>
                    <input
                        type="text"
                        id="address"
                        name="address"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter address"
                    />
                </div>

                <div>
                    <label htmlFor="url" className="block text-sm font-medium text-gray-700">
                        URL/Link
                    </label>
                    <input
                        type="url"
                        id="url"
                        name="url"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="https://..."
                    />
                </div>

                <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                        Price (€)
                    </label>
                    <input
                        type="number"
                        id="price"
                        name="price"
                        min="0"
                        step="0.01"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="0.00"
                    />
                </div>

                <div>
                    <label htmlFor="area" className="block text-sm font-medium text-gray-700">
                        Area (m²)
                    </label>
                    <input
                        type="number"
                        id="area"
                        name="area"
                        min="0"
                        step="0.01"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="0"
                    />
                </div>

                <div>
                    <label htmlFor="bedrooms" className="block text-sm font-medium text-gray-700">
                        Bedrooms
                    </label>
                    <input
                        type="number"
                        id="bedrooms"
                        name="bedrooms"
                        min="0"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="0"
                    />
                </div>

                <div>
                    <label htmlFor="bathrooms" className="block text-sm font-medium text-gray-700">
                        Bathrooms
                    </label>
                    <input
                        type="number"
                        id="bathrooms"
                        name="bathrooms"
                        min="0"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="0"
                    />
                </div>

                <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                        Status *
                    </label>
                    <select
                        id="status"
                        name="status"
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="">Select status</option>
                        <option value="Seen">Seen</option>
                        <option value="ReachedOut">Reached Out</option>
                        <option value="Answered">Answered</option>
                        <option value="VisitArranged">Visit Arranged</option>
                        <option value="Visited">Visited</option>
                        <option value="Accepted">Accepted</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="createdById" className="block text-sm font-medium text-gray-700">
                        Added By *
                    </label>
                    <select
                        id="createdById"
                        name="createdById"
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="">Select user</option>
                        {users.map((user) => (
                            <option key={user.id} value={user.id}>
                                {user.name} ({user.email})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                </label>
                <textarea
                    id="description"
                    name="description"
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter description (optional)"
                />
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? "Adding..." : "Add Flat"}
            </button>
        </form>
    )
}
