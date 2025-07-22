"use client"

import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

declare global {
    interface Window {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        L: any
    }
}

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
    const [isGeocoding, setIsGeocoding] = useState(false)
    const [geocodingFailed, setGeocodingFailed] = useState(false)
    const [latitude, setLatitude] = useState("")
    const [longitude, setLongitude] = useState("")
    const [isMapLoaded, setIsMapLoaded] = useState(false)
    const mapRef = useRef<HTMLDivElement>(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapInstanceRef = useRef<any>(null)
    const router = useRouter()

    // Load Leaflet when component mounts
    useEffect(() => {
        const loadLeaflet = async () => {
            if (typeof window === "undefined") return

            if (!document.getElementById("leaflet-css")) {
                const link = document.createElement("link")
                link.id = "leaflet-css"
                link.rel = "stylesheet"
                link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
                document.head.appendChild(link)
            }

            if (!window.L) {
                const script = document.createElement("script")
                script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
                document.head.appendChild(script)
                await new Promise((resolve) => {
                    script.onload = resolve
                })
            }

            setIsMapLoaded(true)
        }

        loadLeaflet()
    }, [])

    // Update map when coordinates change
    useEffect(() => {
        if (!isMapLoaded || !mapRef.current || !latitude || !longitude) {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove()
                mapInstanceRef.current = null
            }
            return
        }

        const lat = parseFloat(latitude)
        const lng = parseFloat(longitude)

        if (isNaN(lat) || isNaN(lng)) return

        // Clean up previous map
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove()
            mapInstanceRef.current = null
        }

        const container = mapRef.current
        container.innerHTML = ""

        // Create new map
        const map = window.L.map(container).setView([lat, lng], 15)
        mapInstanceRef.current = map

        // Add tiles
        window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map)

        // Add marker
        window.L.marker([lat, lng]).addTo(map).bindPopup("Flat location preview")
    }, [isMapLoaded, latitude, longitude])

    const handleAddressChange = async (address: string) => {
        if (!address.trim()) {
            setLatitude("")
            setLongitude("")
            setGeocodingFailed(false)
            return
        }

        setIsGeocoding(true)
        setGeocodingFailed(false)

        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                    address
                )}&limit=1&countrycodes=es`,
                {
                    headers: {
                        "User-Agent": "SharedFlatTracker/1.0",
                    },
                }
            )

            if (response.ok) {
                const data = await response.json()
                if (data && data.length > 0) {
                    setLatitude(data[0].lat)
                    setLongitude(data[0].lon)
                    setGeocodingFailed(false)
                } else {
                    setLatitude("")
                    setLongitude("")
                    setGeocodingFailed(true)
                }
            } else {
                setLatitude("")
                setLongitude("")
                setGeocodingFailed(true)
            }
        } catch (error) {
            console.error("Geocoding failed:", error)
            setLatitude("")
            setLongitude("")
            setGeocodingFailed(true)
        } finally {
            setIsGeocoding(false)
        }
    }

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
                // Reset coordinate state as well
                setLatitude("")
                setLongitude("")
                setGeocodingFailed(false)
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
                        onBlur={(e) => handleAddressChange(e.target.value)}
                    />
                    {isGeocoding && <p className="mt-1 text-sm text-blue-600">Locating address...</p>}
                    {geocodingFailed && !isGeocoding && (
                        <p className="mt-1 text-sm text-red-600">Failed to locate address</p>
                    )}
                </div>

                <div>
                    <label htmlFor="latitude" className="block text-sm font-medium text-gray-700">
                        Latitude
                    </label>
                    <input
                        type="number"
                        step="any"
                        id="latitude"
                        name="latitude"
                        value={latitude}
                        onChange={(e) => setLatitude(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Auto-filled from address"
                    />
                </div>

                <div>
                    <label htmlFor="longitude" className="block text-sm font-medium text-gray-700">
                        Longitude
                    </label>
                    <input
                        type="number"
                        step="any"
                        id="longitude"
                        name="longitude"
                        value={longitude}
                        onChange={(e) => setLongitude(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Auto-filled from address"
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

            {/* Map Preview */}
            <div className="mt-4">
                {latitude && longitude ? (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Location Preview</label>
                        <div ref={mapRef} className="w-full h-48 border rounded-lg overflow-hidden shadow-sm" />
                    </div>
                ) : (
                    <div className="p-4 bg-gray-50 border border-dashed border-gray-300 rounded-lg text-center">
                        <p className="text-gray-500 text-sm">
                            Enter Address or Latitude and Longitude to see location preview
                        </p>
                    </div>
                )}
            </div>

            {/* Commute Times Section */}
            <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Commute Times to Work</h3>
                <p className="text-sm text-gray-600 mb-4">
                    Enter the time it takes each tracker participant to get from this flat to their work location (in
                    minutes)
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {users.map((user) => (
                        <div key={user.id}>
                            <label
                                htmlFor={`commuteTime_${user.id}`}
                                className="block text-sm font-medium text-gray-700"
                            >
                                {user.name || user.email}
                            </label>
                            <div className="mt-1 relative">
                                <input
                                    type="number"
                                    id={`commuteTime_${user.id}`}
                                    name={`commuteTime_${user.id}`}
                                    min="0"
                                    step="1"
                                    className="block w-full px-3 py-2 pr-12 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="0"
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500 text-sm">min</span>
                                </div>
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                                {user.name ? `(${user.email})` : "Leave empty if unknown"}
                            </p>
                        </div>
                    ))}
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
