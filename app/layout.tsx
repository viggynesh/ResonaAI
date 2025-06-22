import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "Resona - Revolutionary AI Voice Technology",
  description:
    "Experience the future of AI conversation. Clone your voice with revolutionary neural technology and chat with an AI that speaks exactly like you.",
  keywords: "AI, voice cloning, neural technology, Resona, voice synthesis, artificial intelligence",
  authors: [{ name: "Resona" }],
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#FFD700",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  )
}
