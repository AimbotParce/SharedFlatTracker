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
    email: string
    name: string | null
    work_address: string | null
    work_latitude: number | null
    work_longitude: number | null
    createdAt: Date
}

interface UserProfileFormProps {
    user: User
}

export default function UserProfileForm({ user }: UserProfileFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")
    const [isGeocoding, setIsGeocoding] = useState(false)
    const [geocodingFailed, setGeocodingFailed] = useState(false)
    const [latitude, setLatitude] = useState(user.work_latitude?.toString() || "")
    const [longitude, setLongitude] = useState(user.work_longitude?.toString() || "")
    const [isMapLoaded, setIsMapLoaded] = useState(false)
    const [showPasswordFields, setShowPasswordFields] = useState(false)
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
        window.L.marker([lat, lng]).addTo(map).bindPopup("Your work location")
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
        const password = formData.get("password") as string
        const confirmPassword = formData.get("confirmPassword") as string

        // Validate password fields if they're being updated
        if (showPasswordFields) {
            if (!password) {
                setError("Password is required when changing password")
                setIsLoading(false)
                return
            }

            if (password.length < 6) {
                setError("Password must be at least 6 characters long")
                setIsLoading(false)
                return
            }

            if (password !== confirmPassword) {
                setError("Passwords do not match")
                setIsLoading(false)
                return
            }
        }

        const updateData: {
            name: FormDataEntryValue | null
            email: FormDataEntryValue | null
            work_address: FormDataEntryValue | null
            work_latitude: number | null
            work_longitude: number | null
            password?: string
        } = {
            name: formData.get("name"),
            email: formData.get("email"),
            work_address: formData.get("work_address"),
            work_latitude: latitude ? parseFloat(latitude) : null,
            work_longitude: longitude ? parseFloat(longitude) : null,
        }

        if (showPasswordFields && password) {
            updateData.password = password
        }

        try {
            const response = await fetch(`/api/user/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(updateData),
            })

            const data = await response.json()

            if (response.ok) {
                setSuccess("Profile updated successfully!")
                setShowPasswordFields(false)
                router.refresh()
            } else {
                setError(data.error || "Failed to update profile")
            }
        } catch {
            setError("An unexpected error occurred")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}
            {success && (
                <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded">{success}</div>
            )}

            <div className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Name
                    </label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        defaultValue={user.name || ""}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Your full name"
                    />
                </div>

                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email Address *
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        defaultValue={user.email}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="your.email@example.com"
                    />
                </div>

                <div>
                    <label htmlFor="work_address" className="block text-sm font-medium text-gray-700">
                        Work Address
                    </label>
                    <input
                        type="text"
                        id="work_address"
                        name="work_address"
                        defaultValue={user.work_address || ""}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter your work address"
                        onBlur={(e) => handleAddressChange(e.target.value)}
                    />
                    {isGeocoding && <p className="mt-1 text-sm text-blue-600">Locating address...</p>}
                    {geocodingFailed && !isGeocoding && (
                        <p className="mt-1 text-sm text-red-600">Failed to locate address</p>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="work_latitude" className="block text-sm font-medium text-gray-700">
                            Work Latitude
                        </label>
                        <input
                            type="number"
                            step="any"
                            id="work_latitude"
                            name="work_latitude"
                            value={latitude}
                            onChange={(e) => setLatitude(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Auto-filled from address"
                        />
                    </div>

                    <div>
                        <label htmlFor="work_longitude" className="block text-sm font-medium text-gray-700">
                            Work Longitude
                        </label>
                        <input
                            type="number"
                            step="any"
                            id="work_longitude"
                            name="work_longitude"
                            value={longitude}
                            onChange={(e) => setLongitude(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Auto-filled from address"
                        />
                    </div>
                </div>

                {/* Map Preview */}
                <div className="mt-4">
                    {latitude && longitude ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Work Location Preview
                            </label>
                            <div ref={mapRef} className="w-full h-48 border rounded-lg overflow-hidden shadow-sm" />
                        </div>
                    ) : (
                        <div className="p-4 bg-gray-50 border border-dashed border-gray-300 rounded-lg text-center">
                            <p className="text-gray-500 text-sm">
                                Enter work address or latitude/longitude to see location preview
                            </p>
                        </div>
                    )}
                </div>

                {/* Password Section */}
                <div className="border-t pt-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900">Password</h3>
                        <button
                            type="button"
                            onClick={() => setShowPasswordFields(!showPasswordFields)}
                            className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                        >
                            {showPasswordFields ? "Cancel password change" : "Change password"}
                        </button>
                    </div>

                    {showPasswordFields && (
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                    New Password *
                                </label>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="Enter new password (min 6 characters)"
                                />
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                    Confirm New Password *
                                </label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="Confirm new password"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Account Info */}
                <div className="border-t pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Account Information</h3>
                    <p className="text-sm text-gray-600">
                        Account created: {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-indigo-600 text-white py-2 px-6 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? "Updating..." : "Update Profile"}
                </button>
            </div>
        </form>
    )
}
