import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { voiceId, text } = await request.json()

    if (!voiceId || !text) {
      return NextResponse.json({ error: "Missing voiceId or text" }, { status: 400 })
    }

    console.log(`Testing synthesis for voice ${voiceId}:`, text.substring(0, 50))

    // Get voice model
    const voiceModels = global.voiceModels || new Map()
    const voiceModel = voiceModels.get(voiceId)

    if (!voiceModel) {
      return NextResponse.json({ error: "Voice model not found" }, { status: 404 })
    }

    // Test synthesis (simplified)
    const testResult = {
      success: true,
      voiceId,
      textLength: text.length,
      estimatedDuration: text.length * 0.1, // rough estimate
      quality: voiceModel.quality,
      features: voiceModel.features,
    }

    return NextResponse.json(testResult)
  } catch (error) {
    console.error("Voice synthesis test error:", error)
    return NextResponse.json(
      {
        error: "Voice synthesis test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
