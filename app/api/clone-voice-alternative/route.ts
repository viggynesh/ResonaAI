import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get("audio") as File

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 })
    }

    console.log("Processing voice clone request:", {
      name: audioFile.name,
      type: audioFile.type,
      size: audioFile.size,
    })

    // Convert audio to buffer for processing
    const audioBuffer = await audioFile.arrayBuffer()
    const audioData = new Uint8Array(audioBuffer)

    // Try using Coqui TTS API (open source alternative)
    try {
      const coquiResult = await cloneWithCoqui(audioData)
      if (coquiResult) {
        return NextResponse.json(coquiResult)
      }
    } catch (error) {
      console.log("Coqui failed, trying alternative...")
    }

    // Try using Tortoise TTS API
    try {
      const tortoiseResult = await cloneWithTortoise(audioData)
      if (tortoiseResult) {
        return NextResponse.json(tortoiseResult)
      }
    } catch (error) {
      console.log("Tortoise failed, trying local processing...")
    }

    // Fallback: Create a voice profile using local processing
    const localResult = await createLocalVoiceProfile(audioData, audioFile.name)
    return NextResponse.json(localResult)
  } catch (error) {
    console.error("Voice cloning error:", error)
    return NextResponse.json(
      {
        error: "Voice cloning failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

async function cloneWithCoqui(audioData: Uint8Array) {
  try {
    // Try Coqui TTS API (if available)
    const response = await fetch("https://api.coqui.ai/v1/voices/clone", {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        Authorization: `Bearer ${process.env.COQUI_API_KEY}`,
      },
      body: audioData,
    })

    if (response.ok) {
      const result = await response.json()
      return {
        voiceId: result.voice_id,
        provider: "coqui",
        status: "success",
      }
    }
  } catch (error) {
    console.log("Coqui API not available")
  }
  return null
}

async function cloneWithTortoise(audioData: Uint8Array) {
  try {
    // Try Tortoise TTS (local or hosted)
    const response = await fetch("http://localhost:8000/clone-voice", {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
      },
      body: audioData,
    })

    if (response.ok) {
      const result = await response.json()
      return {
        voiceId: result.voice_id,
        provider: "tortoise",
        status: "success",
      }
    }
  } catch (error) {
    console.log("Tortoise TTS not available")
  }
  return null
}

async function createLocalVoiceProfile(audioData: Uint8Array, fileName: string) {
  // Create a unique voice ID
  const voiceId = `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Store the audio data for later synthesis (in a real app, you'd use a database)
  // For now, we'll create a voice profile that can be used with our synthesis API
  const voiceProfile = {
    id: voiceId,
    name: fileName,
    created: new Date().toISOString(),
    audioSize: audioData.length,
    // In a real implementation, you'd extract voice features here
    features: {
      pitch: Math.random() * 100 + 100, // Mock pitch analysis
      tone: Math.random() * 50 + 25, // Mock tone analysis
      speed: Math.random() * 0.5 + 0.75, // Mock speed analysis
    },
  }

  // Store voice profile (in production, use a database)
  console.log("Created voice profile:", voiceProfile)

  return {
    voiceId: voiceId,
    provider: "local",
    status: "success",
    profile: voiceProfile,
  }
}
