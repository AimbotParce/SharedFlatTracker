import { getCurrentUserServer } from "@/lib/getCurrentUser"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import Navigation from "./Navigation"
import "./globals.css"

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
})

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
})

export const metadata: Metadata = {
    title: "Shared Flat Tracker",
    description: "Track and manage shared flat searches with your friends",
}

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    const user = await getCurrentUserServer()

    return (
        <html lang="en">
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                <Navigation user={user} />
                <main>{children}</main>
            </body>
        </html>
    )
}
