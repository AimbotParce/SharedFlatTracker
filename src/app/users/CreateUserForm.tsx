"use client"

import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

declare global {
    interface Window {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        L: any
    }
}

export default function CreateUserForm() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")
    const [isGeocoding, setIsGeocoding] = useState(false)
    const [workLatitude, setWorkLatitude] = useState("")
    const [workLongitude, setWorkLongitude] = useState("")
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
        if (!isMapLoaded || !mapRef.current || !workLatitude || !workLongitude) {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove()
                mapInstanceRef.current = null
            }
            return
        }

        const lat = parseFloat(workLatitude)
        const lng = parseFloat(workLongitude)

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
        window.L.marker([lat, lng]).addTo(map).bindPopup("Work location preview")
    }, [isMapLoaded, workLatitude, workLongitude])

    const handleAddressChange = async (address: string) => {
        if (!address.trim()) {
            setWorkLatitude("")
            setWorkLongitude("")
            return
        }

        setIsGeocoding(true)
        let retries = 5

        while (retries > 0) {
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
                        setWorkLatitude(data[0].lat)
                        setWorkLongitude(data[0].lon)
                        setIsGeocoding(false)
                        return // Success, exit the retry loop
                    } else {
                        setWorkLatitude("")
                        setWorkLongitude("")
                        setIsGeocoding(false)
                        return // No results found, don't retry
                    }
                }
            } catch (error) {
                console.error(`Geocoding failed (${retries} retries left):`, error)
                retries--

                if (retries > 0) {
                    // Wait 1 second before retrying
                    await new Promise((resolve) => setTimeout(resolve, 1000))
                }
            }
        }

        // All retries failed
        console.error("Geocoding failed after all retries")
        setIsGeocoding(false)
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")
        setSuccess("")

        const formData = new FormData(e.currentTarget)

        try {
            const response = await fetch("/api/users", {
                method: "POST",
                body: formData,
            })

            const data = await response.json()

            if (response.ok) {
                setSuccess("User created successfully!")
                router.refresh()
            } else {
                setError(data.error || "Failed to create user")
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

            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                </label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter email address"
                />
            </div>

            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Name
                </label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter full name"
                />
            </div>

            <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                </label>
                <input
                    type="password"
                    id="password"
                    name="password"
                    required
                    minLength={6}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter password (min. 6 characters)"
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
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter work address (optional)"
                    onBlur={(e) => handleAddressChange(e.target.value)}
                />
                {isGeocoding && <p className="mt-1 text-sm text-blue-600">Locating address...</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="work_latitude" className="block text-sm font-medium text-gray-700">
                        Work Latitude
                    </label>
                    <input
                        type="number"
                        step="any"
                        id="work_latitude"
                        name="work_latitude"
                        value={workLatitude}
                        onChange={(e) => setWorkLatitude(e.target.value)}
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
                        value={workLongitude}
                        onChange={(e) => setWorkLongitude(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Auto-filled from address"
                    />
                </div>
            </div>

            {/* Map Preview */}
            <div className="mt-4">
                {workLatitude && workLongitude ? (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Location Preview</label>
                        <div ref={mapRef} className="w-full h-48 border rounded-lg overflow-hidden shadow-sm" />
                    </div>
                ) : (
                    <div className="p-4 bg-gray-50 border border-dashed border-gray-300 rounded-lg text-center">
                        <p className="text-gray-500 text-sm">
                            Enter Work Address or Latitude and Longitude to see location preview
                        </p>
                    </div>
                )}
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? "Creating..." : "Create User"}
            </button>
        </form>
    )
}
