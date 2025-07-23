"use client"

import { UserPayload } from "@/lib/auth"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface NavigationProps {
    user: UserPayload | null
}

export default function Navigation({ user }: NavigationProps) {
    const router = useRouter()
    const [isLoggingOut, setIsLoggingOut] = useState(false)

    const handleLogout = async () => {
        setIsLoggingOut(true)
        try {
            await fetch("/api/auth/logout", {
                method: "POST",
            })
            router.push("/login")
            router.refresh()
        } catch (error) {
            console.error("Logout failed:", error)
        } finally {
            setIsLoggingOut(false)
        }
    }

    return (
        <header className="px-6 py-2 w-full bg-indigo-600 text-white flex items-center justify-between">
            <Link href="/" className="font-bold text-xl">
                Shared Flat Tracker
            </Link>
            {user ? (
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-3">
                        <Link href="/trackers" className="text-sm hover:text-indigo-200">
                            Trackers
                        </Link>
                        <Link href="/profile" className="text-sm hover:text-indigo-200">
                            Profile
                        </Link>
                        <span className="text-sm text-gray-300">|</span>
                        <span className="text-sm">{user.name || user.email}</span>
                        <button
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            className="text-sm cursor-pointer bg-indigo-700 hover:bg-indigo-800 px-3 py-1 rounded disabled:opacity-50"
                        >
                            {isLoggingOut ? "Logging out..." : "Logout"}
                        </button>
                    </div>
                </div>
            ) : (
                <nav className="flex space-x-4">
                    <Link href="/login" className="hover:text-indigo-200">
                        Login
                    </Link>
                    <Link href="/register" className="hover:text-indigo-200">
                        Register
                    </Link>
                </nav>
            )}
        </header>
    )
}
