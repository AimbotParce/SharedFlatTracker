"use client"

import { useEffect, useRef, useState } from "react"

// Interface for flat data with coordinates
interface Flat {
    id: number
    name: string | null
    address: string | null
    latitude: number | null
    longitude: number | null
    price: number | null
    status: string
    url: string | null
}

// Interface for user data with work coordinates
interface User {
    id: number
    name: string | null
    email: string
    workLatitude?: number | null
    workLongitude?: number | null
    workAddress?: string | null
}

interface FlatsMapProps {
    flats: Flat[]
    users: User[]
}

declare global {
    interface Window {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        L: any
    }
}

interface MarkerData {
    lat: number
    lng: number
    name: string
    address: string
    price: string
    status: string
    url: string | null
    type: "flat" | "user"
}

export default function FlatsMap({ flats, users }: FlatsMapProps) {
    const mapRef = useRef<HTMLDivElement>(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapInstanceRef = useRef<any>(null)
    const [isReady, setIsReady] = useState(false)
    const [markers, setMarkers] = useState<MarkerData[]>([])

    useEffect(() => {
        const setupMap = async () => {
            // Load Leaflet
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

            // Filter flats that have coordinates
            const flatsWithCoordinates = flats.filter((flat) => flat.latitude != null && flat.longitude != null)

            // Filter users that have work coordinates
            const usersWithWorkCoordinates = users.filter(
                (user) => user.workLatitude != null && user.workLongitude != null
            )

            if (flatsWithCoordinates.length === 0 && usersWithWorkCoordinates.length === 0) {
                setIsReady(true)
                return
            }

            // Create flat markers
            const flatMarkers = flatsWithCoordinates.map((flat) => ({
                lat: Number(flat.latitude),
                lng: Number(flat.longitude),
                name: flat.name || "Unnamed Flat",
                address: flat.address || "No address",
                price: flat.price ? `€${flat.price.toLocaleString()}` : "Price not specified",
                status: flat.status,
                url: flat.url,
                type: "flat" as const,
            }))

            // Create user work location markers
            const userMarkers = usersWithWorkCoordinates.map((user) => ({
                lat: Number(user.workLatitude),
                lng: Number(user.workLongitude),
                name: user.name || user.email,
                address: user.workAddress || "Work location",
                price: "",
                status: "",
                url: null,
                type: "user" as const,
            }))

            // Combine all markers
            const allMarkers = [...flatMarkers, ...userMarkers]

            // Set everything at once
            setMarkers(allMarkers)
            setIsReady(true)
        }

        setupMap()
    }, [flats, users])

    useEffect(() => {
        if (!isReady || !mapRef.current || markers.length === 0) return

        // Clean up previous map
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove()
            mapInstanceRef.current = null
        }

        const container = mapRef.current
        container.innerHTML = ""

        // Create map - center on Barcelona as default
        const map = window.L.map(container).setView([41.3851, 2.1734], 12)
        mapInstanceRef.current = map

        // Add tiles
        window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map)

        // Add all markers at once
        markers.forEach((markerData) => {
            let marker

            if (markerData.type === "user") {
                // Create a custom green icon for user work locations
                const greenIcon = window.L.divIcon({
                    className: "custom-user-marker",
                    html: `
                        <div style="
                            background-color: #10b981; 
                            width: 25px; 
                            height: 25px; 
                            border-radius: 50%; 
                            border: 3px solid white; 
                            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        ">
                            <div style="
                                background-color: white; 
                                width: 8px; 
                                height: 8px; 
                                border-radius: 50%;
                            "></div>
                        </div>
                    `,
                    iconSize: [25, 25],
                    iconAnchor: [12, 12],
                    popupAnchor: [0, -12],
                })
                marker = window.L.marker([markerData.lat, markerData.lng], { icon: greenIcon }).addTo(map)
                marker.bindPopup(`
                    <div style="min-width: 200px;">
                        <h3 style="margin: 0 0 8px 0; font-weight: bold; color: #10b981;">📍 ${markerData.name}</h3>
                        <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">${markerData.address}</p>
                        <div style="margin: 0 0 8px 0;">
                            <span style="background: #10b981; color: white; padding: 2px 6px; border-radius: 4px; font-size: 12px;">
                                Work Location
                            </span>
                        </div>
                    </div>
                `)
            } else {
                // Use default blue marker for flats
                marker = window.L.marker([markerData.lat, markerData.lng]).addTo(map)
                marker.bindPopup(`
                    <div style="min-width: 200px;">
                        <h3 style="margin: 0 0 8px 0; font-weight: bold;">🏠 ${markerData.name}</h3>
                        <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">${markerData.address}</p>
                        <div style="margin: 0 0 8px 0;">
                            <span style="background: #3b82f6; color: white; padding: 2px 6px; border-radius: 4px; font-size: 12px;">
                                ${markerData.status}
                            </span>
                        </div>
                        <p style="margin: 0 0 8px 0; font-weight: bold; color: #059669;">
                            ${markerData.price}
                        </p>
                        ${
                            markerData.url
                                ? `
                            <a href="${markerData.url}" 
                               target="_blank" 
                               style="color: #0066cc; text-decoration: none; font-size: 14px;">
                               View listing →
                            </a>
                        `
                                : ""
                        }
                    </div>
                `)
            }
        })

        // Fit bounds to show all markers
        if (markers.length > 0) {
            const bounds = markers.map((m) => [m.lat, m.lng])
            map.fitBounds(bounds, { padding: [20, 20] })
        }

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove()
                mapInstanceRef.current = null
            }
        }
    }, [isReady, markers])

    const flatsWithCoordinates = flats.filter((flat) => flat.latitude != null && flat.longitude != null)
    const usersWithWorkCoordinates = users.filter((user) => user.workLatitude != null && user.workLongitude != null)

    if (flatsWithCoordinates.length === 0 && usersWithWorkCoordinates.length === 0) {
        return (
            <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                <div className="text-center">
                    <div className="text-gray-500 text-lg mb-2">No locations available</div>
                    <div className="text-gray-400 text-sm">
                        Add coordinates to flats and work locations to see them on the map
                    </div>
                </div>
            </div>
        )
    }

    if (!isReady) {
        return (
            <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-gray-500 text-center">
                    <div className="text-lg">Loading map...</div>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full">
            {/* Map Legend */}
            <div className="mb-3 flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-sm"></div>
                    <span className="text-gray-700">Flats</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-sm"></div>
                    <span className="text-gray-700">Work Locations</span>
                </div>
            </div>

            {/* Map Container */}
            <div className="w-full h-96 border rounded-lg overflow-hidden shadow-md">
                <div ref={mapRef} className="w-full h-full" />
            </div>
        </div>
    )
}
