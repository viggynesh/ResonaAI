import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { audioData, analysis } = body

    if (!audioData || !analysis) {
      return NextResponse.json({ error: "Missing audio data or analysis" }, { status: 400 })
    }

    console.log("Creating voice model with analysis:", Object.keys(analysis))

    // Create unique voice ID
    const voiceId = `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create voice model based on analysis
    const voiceModel = {
      voiceId,
      created: new Date().toISOString(),
      features: {
        pitch: analysis.pitch?.average || 150,
        tone: analysis.tone?.brightness || 0.5,
        speed: analysis.rhythm?.speed || 1.0,
        formants: analysis.formants || { f1: 500, f2: 1500, f3: 2500 },
        spectral: analysis.spectral || { centroid: 1000, rolloff: 3000 },
      },
      audioDataSize: Array.isArray(audioData) ? audioData.length : 0,
      quality: calculateVoiceQuality(analysis),
    }

    // Store voice model in global memory (in production, use a database)
    if (!global.voiceModels) {
      global.voiceModels = new Map()
    }

    global.voiceModels.set(voiceId, {
      ...voiceModel,
      audioData: Array.isArray(audioData) ? new Uint8Array(audioData) : new Uint8Array(),
    })

    console.log("Voice model created successfully:", voiceModel.voiceId)

    return NextResponse.json({
      success: true,
      voiceId: voiceModel.voiceId,
      features: voiceModel.features,
      quality: voiceModel.quality,
    })
  } catch (error) {
    console.error("Voice model creation error:", error)
    return NextResponse.json(
      {
        error: "Voice model creation failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

function calculateVoiceQuality(analysis: any): number {
  // Calculate quality score based on analysis
  let score = 0.5

  try {
    // Check pitch stability
    if (analysis.pitch?.range && analysis.pitch.range < 100) score += 0.2

    // Check tone characteristics
    if (analysis.tone?.roughness && analysis.tone.roughness < 0.3) score += 0.2

    // Check spectral features
    if (analysis.spectral?.centroid && analysis.spectral.centroid > 800 && analysis.spectral.centroid < 2000)
      score += 0.1
  } catch (error) {
    console.log("Error calculating quality, using default")
  }

  return Math.min(1.0, Math.max(0.1, score))
}
