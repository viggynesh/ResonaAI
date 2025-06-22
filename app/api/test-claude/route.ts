import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    console.log("🧪 Testing Claude API connection...")

    // Check if Claude API key exists
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({
        success: false,
        error: "ANTHROPIC_API_KEY environment variable is not set",
      })
    }

    // Try to decode the base64 encoded API key, but also try using it directly
    let claudeApiKey: string
    const rawKey = process.env.ANTHROPIC_API_KEY

    console.log("🔑 Raw key from env:", rawKey.substring(0, 20) + "...")

    // First try using the key directly (in case it's not base64 encoded)
    if (rawKey.startsWith("sk-ant-")) {
      claudeApiKey = rawKey
      console.log("✅ Using key directly (not base64 encoded)")
    } else {
      // Try base64 decoding
      try {
        claudeApiKey = Buffer.from(rawKey, "base64").toString("utf-8")
        console.log("✅ Claude API key decoded from base64")
      } catch (decodeError) {
        console.error("❌ Base64 decode failed, trying raw key:", decodeError)
        claudeApiKey = rawKey // Fallback to raw key
      }
    }

    console.log("🔑 Final key being used:", claudeApiKey.substring(0, 20) + "...")

    // Test API call
    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": claudeApiKey,
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 50,
        messages: [
          {
            role: "user",
            content: "Say hello! This is a test.",
          },
        ],
      }),
    })

    console.log("📡 Claude test response status:", claudeResponse.status)
    console.log("📡 Claude response headers:", Object.fromEntries(claudeResponse.headers.entries()))

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text()
      console.error("❌ Claude API test error:", errorText)
      return NextResponse.json({
        success: false,
        error: `Claude API error: ${claudeResponse.status}`,
        details: errorText,
        keyUsed: claudeApiKey.substring(0, 20) + "...",
      })
    }

    const claudeData = await claudeResponse.json()
    console.log("✅ Claude test successful:", claudeData)
    const testResponse = claudeData.content[0]?.text

    return NextResponse.json({
      success: true,
      message: "Claude API is working!",
      testResponse: testResponse,
      model: "claude-3-5-sonnet-20241022",
      keyUsed: claudeApiKey.substring(0, 20) + "...",
    })
  } catch (error) {
    console.error("❌ Claude test error:", error)
    return NextResponse.json({
      success: false,
      error: "Test failed",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
