import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get("audio") as File

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 })
    }

    console.log("🎤 Creating voice clone with ElevenLabs:", audioFile.name)

    // Check if API key exists
    if (!process.env.ELEVENLABS_API_KEY) {
      console.error("ELEVENLABS_API_KEY environment variable is not set")
      return NextResponse.json({ error: "ElevenLabs API key not configured" }, { status: 500 })
    }

    // Handle API key - the new key starts with sk_ so use it directly
    let elevenLabsApiKey: string
    const rawKey = process.env.ELEVENLABS_API_KEY

    if (rawKey && rawKey.startsWith("sk_")) {
      elevenLabsApiKey = rawKey
      console.log("✅ Using ElevenLabs key directly")
    } else if (rawKey) {
      try {
        elevenLabsApiKey = Buffer.from(rawKey, "base64").toString("utf-8")
        console.log("✅ ElevenLabs API key decoded from base64")
      } catch (decodeError) {
        console.error("Failed to decode ElevenLabs API key:", decodeError)
        return NextResponse.json({ error: "API key decode error" }, { status: 500 })
      }
    } else {
      console.error("ELEVENLABS_API_KEY environment variable is not set")
      return NextResponse.json({ error: "ElevenLabs API key not configured" }, { status: 500 })
    }

    // Convert audio file to the format expected by ElevenLabs
    const audioBuffer = await audioFile.arrayBuffer()

    // Create a new FormData for ElevenLabs API
    const elevenLabsFormData = new FormData()

    // Convert to a proper audio blob
    const audioBlob = new Blob([audioBuffer], { type: "audio/mpeg" })
    elevenLabsFormData.append("files", audioBlob, "voice-sample.mp3")
    elevenLabsFormData.append("name", `Voice Clone ${Date.now()}`)
    elevenLabsFormData.append("description", "AI voice clone from user recording")

    console.log("📡 Calling ElevenLabs voice cloning API...")

    // Call ElevenLabs API to create voice clone
    const response = await fetch("https://api.elevenlabs.io/v1/voices/add", {
      method: "POST",
      headers: {
        "xi-api-key": elevenLabsApiKey,
      },
      body: elevenLabsFormData,
    })

    console.log("📡 ElevenLabs response status:", response.status)

    if (!response.ok) {
      let errorText: string
      let errorDetails: any = {}

      try {
        // Try to parse as JSON first
        const contentType = response.headers.get("content-type")
        if (contentType && contentType.includes("application/json")) {
          errorDetails = await response.json()
          errorText =
            errorDetails.detail?.message || errorDetails.message || errorDetails.error || `HTTP ${response.status}`
        } else {
          // If not JSON, get as text
          errorText = await response.text()
          // Clean up common error prefixes
          if (errorText.startsWith("Internal server error") || errorText.startsWith("Internal s")) {
            errorText = "ElevenLabs service temporarily unavailable"
          }
        }
      } catch (parseError) {
        console.error("Error parsing ElevenLabs response:", parseError)
        errorText = `ElevenLabs API error (${response.status})`
      }

      console.error("❌ ElevenLabs API error:", response.status, errorText)

      if (response.status === 401) {
        return NextResponse.json({ error: "Invalid ElevenLabs API key" }, { status: 401 })
      }

      if (response.status === 429) {
        return NextResponse.json({ error: "Rate limit exceeded. Please try again in a moment." }, { status: 429 })
      }

      return NextResponse.json(
        {
          error: "Voice cloning failed",
          details: errorText,
        },
        { status: response.status },
      )
    }

    // Also improve the success response parsing
    let data: any
    try {
      data = await response.json()
    } catch (jsonError) {
      console.error("Error parsing success response:", jsonError)
      return NextResponse.json(
        {
          error: "Voice cloning completed but response parsing failed",
          details: "Please try again",
        },
        { status: 500 },
      )
    }

    console.log("✅ Voice clone created successfully:", data.voice_id)

    return NextResponse.json({
      success: true,
      voiceId: data.voice_id,
      name: data.name,
      message: "Voice successfully cloned with ElevenLabs!",
    })
  } catch (error) {
    console.error("❌ Voice cloning error:", error)
    return NextResponse.json(
      {
        error: "Failed to clone voice",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
