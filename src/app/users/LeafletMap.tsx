"use client"

import { User } from "@/generated/prisma"
import { useEffect, useRef, useState } from "react"

interface LeafletMapProps {
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
}

export default function LeafletMap({ users }: LeafletMapProps) {
    const mapRef = useRef<HTMLDivElement>(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapInstanceRef = useRef<any>(null)
    const [isReady, setIsReady] = useState(false)
    const [markers, setMarkers] = useState<MarkerData[]>([])

    useEffect(() => {
        // Reset state when users change
        setIsReady(false)
        setMarkers([])

        const usersWithAddresses = users.filter((user) => user.work_address && user.work_address.trim() !== "")

        if (usersWithAddresses.length === 0) return

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

            // Use stored coordinates or fallback to geocoding
            const allMarkers = usersWithAddresses.map((user) => {
                // If we have stored coordinates, use them
                if (user.work_latitude && user.work_longitude) {
                    return {
                        lat: Number(user.work_latitude),
                        lng: Number(user.work_longitude),
                        name: user.name || "Unknown",
                        address: user.work_address || "",
                    }
                }

                // Fallback to Barcelona area if no coordinates
                return undefined
            })

            // Set everything at once
            setMarkers(allMarkers.filter((m): m is MarkerData => m !== undefined))
            setIsReady(true)
        }

        setupMap()
    }, [users])

    useEffect(() => {
        if (!isReady || !mapRef.current || markers.length === 0) return

        // Clean up previous map
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove()
            mapInstanceRef.current = null
        }

        const container = mapRef.current
        container.innerHTML = ""

        // Create map
        const map = window.L.map(container).setView([41.3851, 2.1734], 12)
        mapInstanceRef.current = map

        // Add tiles
        window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map)

        // Add all markers at once
        markers.forEach((markerData) => {
            const marker = window.L.marker([markerData.lat, markerData.lng]).addTo(map)
            marker.bindPopup(`
                <div>
                    <h3 style="margin: 0 0 8px 0; font-weight: bold;">${markerData.name}</h3>
                    <p style="margin: 0 0 8px 0; color: #666;">${markerData.address}</p>
                    <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(markerData.address)}" 
                       target="_blank" 
                       style="color: #0066cc; text-decoration: none;">
                       View exact location →
                    </a>
                </div>
            `)
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

    if (!isReady) {
        return (
            <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-gray-500 text-center">
                    <div className="text-lg">Locating addresses...</div>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full h-96 border rounded-lg overflow-hidden shadow-md">
            <div ref={mapRef} className="w-full h-full" />
        </div>
    )
}
