import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { text, voiceProfile } = await request.json()

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 })
    }

    console.log("🗣️ Synthesizing speech:", text.substring(0, 50))

    // Try ElevenLabs first if available
    if (process.env.ELEVENLABS_API_KEY) {
      try {
        const elevenLabsAudio = await synthesizeWithElevenLabs(text, voiceProfile)
        if (elevenLabsAudio) {
          return new Response(elevenLabsAudio, {
            headers: {
              "Content-Type": "audio/mpeg",
              "Cache-Control": "no-cache",
            },
          })
        }
      } catch (error) {
        console.log("ElevenLabs failed, using browser synthesis")
      }
    }

    // Fallback: Return instructions for browser synthesis
    return NextResponse.json({
      useBrowserSynthesis: true,
      text,
      voiceSettings: {
        pitch: Math.max(0.1, Math.min(2, voiceProfile.features.pitch.fundamental / 150)),
        rate: Math.max(0.3, Math.min(1.8, voiceProfile.features.temporal.speechRatio * 1.2)),
        volume: 0.9,
      },
    })
  } catch (error) {
    console.error("Speech synthesis error:", error)
    return NextResponse.json(
      {
        error: "Speech synthesis failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

async function synthesizeWithElevenLabs(text: string, voiceProfile: any): Promise<ArrayBuffer | null> {
  try {
    const elevenLabsApiKey = Buffer.from(process.env.ELEVENLABS_API_KEY!, "base64").toString("utf-8")

    // Use a default voice ID or create one based on voice profile
    const voiceId = "21m00Tcm4TlvDq8ikWAM" // Default voice, you can customize this

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        Accept: "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": elevenLabsApiKey,
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8,
          style: 0.5,
          use_speaker_boost: true,
        },
      }),
    })

    if (response.ok) {
      return await response.arrayBuffer()
    }
  } catch (error) {
    console.error("ElevenLabs synthesis error:", error)
  }
  return null
}
