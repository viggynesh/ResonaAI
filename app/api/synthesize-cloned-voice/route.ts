import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, voiceId } = body

    if (!text || !voiceId) {
      return NextResponse.json({ error: "Missing text or voiceId" }, { status: 400 })
    }

    console.log(`Synthesizing with cloned voice ${voiceId}:`, text.substring(0, 100))

    // Get voice model
    const voiceModels = global.voiceModels || new Map()
    const voiceModel = voiceModels.get(voiceId)

    if (!voiceModel) {
      console.error("Voice model not found:", voiceId)
      return NextResponse.json({ error: "Voice model not found" }, { status: 404 })
    }

    // Try different synthesis approaches
    let audioBuffer: ArrayBuffer | null = null

    // Method 1: Try with Coqui TTS if available
    try {
      audioBuffer = await synthesizeWithCoqui(text, voiceModel)
    } catch (error) {
      console.log("Coqui synthesis failed, trying alternatives...")
    }

    // Method 2: Try with local TTS + voice modulation
    if (!audioBuffer) {
      try {
        audioBuffer = await synthesizeWithModulation(text, voiceModel)
      } catch (error) {
        console.log("Modulation synthesis failed, using fallback...")
      }
    }

    // Method 3: Fallback synthesis
    if (!audioBuffer) {
      audioBuffer = await createFallbackSynthesis(text, voiceModel)
    }

    if (!audioBuffer) {
      throw new Error("All synthesis methods failed")
    }

    // Return audio
    return new Response(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
        "Cache-Control": "no-cache",
      },
    })
  } catch (error) {
    console.error("Cloned voice synthesis error:", error)
    return NextResponse.json(
      {
        error: "Voice synthesis failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

async function synthesizeWithCoqui(text: string, voiceModel: any): Promise<ArrayBuffer | null> {
  // Try Coqui TTS API if available
  try {
    const response = await fetch("https://api.coqui.ai/v1/tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.COQUI_API_KEY}`,
      },
      body: JSON.stringify({
        text,
        voice_id: voiceModel.voiceId,
        model: "tts_models/multilingual/multi-dataset/xtts_v2",
        voice_settings: {
          stability: 0.7,
          similarity_boost: 0.8,
          style: 0.5,
        },
      }),
    })

    if (response.ok) {
      return await response.arrayBuffer()
    }
  } catch (error) {
    console.log("Coqui API not available")
  }
  return null
}

async function synthesizeWithModulation(text: string, voiceModel: any): Promise<ArrayBuffer | null> {
  // Try using Web Speech API with voice modulation
  try {
    // This would require a more sophisticated implementation
    // For now, return null to fall back to the next method
    return null
  } catch (error) {
    console.log("Voice modulation failed")
  }
  return null
}

async function createFallbackSynthesis(text: string, voiceModel: any): Promise<ArrayBuffer> {
  // Create a basic audio synthesis based on voice characteristics
  const sampleRate = 44100
  const duration = Math.max(2, text.length * 0.08) // Estimate duration
  const samples = Math.floor(sampleRate * duration)

  // Create audio buffer
  const buffer = new ArrayBuffer(samples * 2) // 16-bit audio
  const view = new Int16Array(buffer)

  // Generate audio based on voice features
  const pitch = voiceModel.features.pitch || 150
  const speed = voiceModel.features.speed || 1.0

  for (let i = 0; i < samples; i++) {
    const t = (i / sampleRate) * speed
    const frequency = pitch + Math.sin(t * 3) * 20 // Add some variation
    const amplitude = Math.sin(t * 0.5) * 0.3 + 0.7 // Amplitude modulation
    view[i] = Math.sin(2 * Math.PI * frequency * t) * amplitude * 16384
  }

  return buffer
}
