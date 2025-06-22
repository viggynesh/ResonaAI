import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const keys = {
      groq: !!process.env.GROQ_API_KEY,
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      elevenlabs: !!process.env.ELEVENLABS_API_KEY,
      vapi_private: !!process.env.VAPI_PRIVATE_KEY,
      vapi_public: !!process.env.VAPI_PUBLIC_KEY,
    }

    // Test decoding each key
    const decodedKeys: Record<string, boolean> = {}

    for (const [service, hasKey] of Object.entries(keys)) {
      if (hasKey) {
        try {
          const envKey =
            process.env[`${service.toUpperCase().replace("_", "_")}_API_KEY`] ||
            process.env[`${service.toUpperCase()}_KEY`] ||
            process.env[`${service.toUpperCase()}_API_KEY`]

          if (service === "vapi_private") {
            Buffer.from(process.env.VAPI_PRIVATE_KEY!, "base64").toString("utf-8")
          } else if (service === "vapi_public") {
            Buffer.from(process.env.VAPI_PUBLIC_KEY!, "base64").toString("utf-8")
          } else if (service === "groq") {
            Buffer.from(process.env.GROQ_API_KEY!, "base64").toString("utf-8")
          } else if (service === "anthropic") {
            Buffer.from(process.env.ANTHROPIC_API_KEY!, "base64").toString("utf-8")
          } else if (service === "elevenlabs") {
            Buffer.from(process.env.ELEVENLABS_API_KEY!, "base64").toString("utf-8")
          }

          decodedKeys[service] = true
        } catch (error) {
          decodedKeys[service] = false
        }
      } else {
        decodedKeys[service] = false
      }
    }

    return NextResponse.json({
      keysPresent: keys,
      keysDecoded: decodedKeys,
      allValid: Object.values(decodedKeys).every(Boolean),
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
