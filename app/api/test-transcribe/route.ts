import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get("audio") as File

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 })
    }

    // Log file details
    console.log("Test transcription - File details:", {
      name: audioFile.name,
      type: audioFile.type,
      size: audioFile.size,
    })

    // Check API key
    const hasGroqKey = !!process.env.GROQ_API_KEY
    let keyValid = false

    if (hasGroqKey) {
      try {
        const decoded = Buffer.from(process.env.GROQ_API_KEY!, "base64").toString("utf-8")
        keyValid = decoded.length > 10 && decoded.startsWith("gsk_")
      } catch (e) {
        keyValid = false
      }
    }

    // Return test results
    return NextResponse.json({
      fileReceived: true,
      fileName: audioFile.name,
      fileType: audioFile.type,
      fileSize: audioFile.size,
      hasApiKey: hasGroqKey,
      apiKeyValid: keyValid,
      message: "Test endpoint working - file received successfully",
    })
  } catch (error) {
    console.error("Test transcription error:", error)
    return NextResponse.json(
      {
        error: "Test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
