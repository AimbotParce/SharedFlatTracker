"use client"

import { useState } from "react"

interface CommuteTime {
    id: number
    timeMinutes: number | null
    user: {
        id: number
        name: string | null
        email: string
    }
}

interface User {
    id: number
    name: string | null
    email: string
}

interface CommuteTimeCellProps {
    commuteTimes: CommuteTime[]
    users: User[]
}

export default function CommuteTimeCell({ commuteTimes, users }: CommuteTimeCellProps) {
    const [showTooltip, setShowTooltip] = useState(false)

    // Filter out commute times with 0 minutes or null (likely means no data)
    const validCommuteTimes = commuteTimes.filter((ct) => ct.timeMinutes && ct.timeMinutes > 0)

    if (validCommuteTimes.length === 0) {
        return <span className="text-gray-400">No data</span>
    }

    // Calculate average
    const average = validCommuteTimes.reduce((sum, ct) => sum + (ct.timeMinutes || 0), 0) / validCommuteTimes.length

    // Create breakdown for tooltip
    const breakdown = users
        .map((user) => {
            const commuteTime = commuteTimes.find((ct) => ct.user.id === user.id)
            return {
                user,
                minutes: commuteTime?.timeMinutes || null,
            }
        })
        .filter((item) => item.minutes !== null && item.minutes > 0)

    return (
        <div className="relative">
            <div
                className="cursor-help underline decoration-dotted"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
            >
                {Math.round(average)} min
            </div>

            {showTooltip && (
                <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl whitespace-nowrap min-w-max">
                    <div className="font-semibold mb-1 text-blue-200">Commute Breakdown:</div>
                    {breakdown.map((item) => (
                        <div key={item.user.id} className="flex justify-between gap-4 py-0.5">
                            <span className="text-gray-300">{item.user.name || item.user.email}:</span>
                            <span className="text-white font-medium">{item.minutes} min</span>
                        </div>
                    ))}
                    {breakdown.length > 1 && (
                        <div className="border-t border-gray-600 mt-1 pt-1 flex justify-between gap-4 font-semibold">
                            <span className="text-blue-200">Average:</span>
                            <span className="text-blue-100">{Math.round(average)} min</span>
                        </div>
                    )}
                    {/* Tooltip arrow */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                </div>
            )}
        </div>
    )
}
