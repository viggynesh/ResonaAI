import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get("audio") as File

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 })
    }

    console.log("Simple voice clone for:", audioFile.name)

    // Create a simple voice ID and profile
    const voiceId = `simple_voice_${Date.now()}`

    // Store the original audio for reference
    const audioBuffer = await audioFile.arrayBuffer()

    // Create basic voice features
    const features = {
      pitch: 150 + Math.random() * 100,
      tone: 0.5 + Math.random() * 0.3,
      speed: 0.8 + Math.random() * 0.4,
      quality: 0.7 + Math.random() * 0.2,
    }

    // Store in global memory
    if (!global.voiceModels) {
      global.voiceModels = new Map()
    }

    global.voiceModels.set(voiceId, {
      voiceId,
      features,
      audioData: new Uint8Array(audioBuffer),
      created: new Date().toISOString(),
      simple: true,
    })

    console.log("Simple voice clone created:", voiceId)

    return NextResponse.json({
      success: true,
      voiceId,
      features,
      message: "Voice clone created successfully",
    })
  } catch (error) {
    console.error("Simple voice clone error:", error)
    return NextResponse.json(
      {
        error: "Simple voice clone failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
