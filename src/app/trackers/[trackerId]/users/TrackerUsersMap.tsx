"use client"

import { useEffect, useRef, useState } from "react"

declare global {
    interface Window {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        L: any
    }
}

interface TrackerUser {
    id: number
    name: string | null
    email: string
    work_address: string | null
    work_latitude: number | null
    work_longitude: number | null
    role: string
    isOwner: boolean
}

interface TrackerUsersMapProps {
    users: TrackerUser[]
}

export default function TrackerUsersMap({ users }: TrackerUsersMapProps) {
    const [isMapLoaded, setIsMapLoaded] = useState(false)
    const mapRef = useRef<HTMLDivElement>(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapInstanceRef = useRef<any>(null)

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

    // Initialize map and markers when Leaflet is loaded
    useEffect(() => {
        if (!isMapLoaded || !mapRef.current || users.length === 0) return

        // Clean up previous map
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove()
            mapInstanceRef.current = null
        }

        const container = mapRef.current
        container.innerHTML = ""

        // Get users with valid coordinates
        const usersWithCoords = users.filter(
            (user) =>
                user.work_latitude && user.work_longitude && !isNaN(user.work_latitude) && !isNaN(user.work_longitude)
        )

        if (usersWithCoords.length === 0) return

        // Create map centered on first user
        const firstUser = usersWithCoords[0]
        const map = window.L.map(container).setView([firstUser.work_latitude, firstUser.work_longitude], 10)
        mapInstanceRef.current = map

        // Add tiles
        window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map)

        // Add markers for each user
        usersWithCoords.forEach((user) => {
            const marker = window.L.marker([user.work_latitude!, user.work_longitude!]).addTo(map)

            const roleColor = user.isOwner ? "#10B981" : user.role === "Admin" ? "#8B5CF6" : "#3B82F6"
            const roleBadge = `<span style="background-color: ${roleColor}; color: white; padding: 2px 6px; border-radius: 12px; font-size: 12px; font-weight: 600;">${
                user.isOwner ? "Owner" : user.role
            }</span>`

            marker.bindPopup(`
                <div style="min-width: 200px;">
                    <div style="font-weight: bold; margin-bottom: 4px;">${user.name || user.email}</div>
                    <div style="color: #666; margin-bottom: 8px;">${user.email}</div>
                    <div style="margin-bottom: 8px;">${roleBadge}</div>
                    ${user.work_address ? `<div style="color: #666; font-size: 14px;">${user.work_address}</div>` : ""}
                    <div style="margin-top: 8px; font-size: 12px; color: #999;">
                        ${user.work_latitude!.toFixed(6)}, ${user.work_longitude!.toFixed(6)}
                    </div>
                </div>
            `)
        })

        // Fit map to show all markers if multiple users
        if (usersWithCoords.length > 1) {
            const group = window.L.featureGroup(
                usersWithCoords.map((user) => window.L.marker([user.work_latitude!, user.work_longitude!]))
            )
            map.fitBounds(group.getBounds().pad(0.1))
        }

        // Cleanup function
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove()
                mapInstanceRef.current = null
            }
        }
    }, [isMapLoaded, users])

    if (users.length === 0) {
        return (
            <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                <div className="text-center">
                    <div className="text-gray-500 text-lg mb-2">No users with work locations</div>
                    <div className="text-gray-400 text-sm">Add users with work addresses to see them on the map</div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div ref={mapRef} className="w-full h-96 border rounded-lg overflow-hidden shadow-sm" />
            <div className="text-sm text-gray-600">
                Showing {users.length} user{users.length !== 1 ? "s" : ""} with work location coordinates
            </div>
        </div>
    )
}
