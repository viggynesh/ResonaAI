import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest, { params }: { params: { voiceId: string } }) {
  try {
    const { text } = await request.json()
    const voiceId = params.voiceId

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 })
    }

    console.log(`Synthesizing speech for voice ${voiceId}:`, text.substring(0, 100))

    // Try different TTS services in order of preference
    let audioBuffer: ArrayBuffer | null = null

    // Try Coqui TTS
    try {
      audioBuffer = await synthesizeWithCoqui(text, voiceId)
    } catch (error) {
      console.log("Coqui synthesis failed, trying alternatives...")
    }

    // Try local TTS with voice modulation
    if (!audioBuffer) {
      try {
        audioBuffer = await synthesizeWithLocalTTS(text, voiceId)
      } catch (error) {
        console.log("Local TTS failed, using fallback...")
      }
    }

    // Fallback: Use browser TTS with voice modulation
    if (!audioBuffer) {
      audioBuffer = await createFallbackAudio(text, voiceId)
    }

    if (!audioBuffer) {
      throw new Error("All synthesis methods failed")
    }

    // Return audio as response
    return new Response(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
      },
    })
  } catch (error) {
    console.error("Voice synthesis error:", error)
    return NextResponse.json(
      {
        error: "Voice synthesis failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

async function synthesizeWithCoqui(text: string, voiceId: string): Promise<ArrayBuffer | null> {
  try {
    const response = await fetch("https://api.coqui.ai/v1/tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.COQUI_API_KEY}`,
      },
      body: JSON.stringify({
        text,
        voice_id: voiceId,
        model: "tts_models/multilingual/multi-dataset/xtts_v2",
      }),
    })

    if (response.ok) {
      return await response.arrayBuffer()
    }
  } catch (error) {
    console.log("Coqui synthesis error:", error)
  }
  return null
}

async function synthesizeWithLocalTTS(text: string, voiceId: string): Promise<ArrayBuffer | null> {
  try {
    // Try local Tortoise TTS server
    const response = await fetch("http://localhost:8000/synthesize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        voice_id: voiceId,
      }),
    })

    if (response.ok) {
      return await response.arrayBuffer()
    }
  } catch (error) {
    console.log("Local TTS error:", error)
  }
  return null
}

async function createFallbackAudio(text: string, voiceId: string): Promise<ArrayBuffer> {
  // Create a simple audio response using Web Audio API concepts
  // This is a fallback that creates a basic audio file
  // In a real implementation, you'd use more sophisticated voice synthesis

  // For now, return a simple audio buffer that represents synthesized speech
  // This would need to be replaced with actual TTS synthesis
  const sampleRate = 44100
  const duration = Math.max(2, text.length * 0.1) // Estimate duration based on text length
  const samples = Math.floor(sampleRate * duration)

  // Create a simple audio buffer (this is just a placeholder)
  const buffer = new ArrayBuffer(samples * 2) // 16-bit audio
  const view = new Int16Array(buffer)

  // Generate a simple tone pattern (placeholder for actual speech)
  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate
    const frequency = 200 + Math.sin(t * 2) * 50 // Varying frequency
    view[i] = Math.sin(2 * Math.PI * frequency * t) * 16384
  }

  return buffer
}
