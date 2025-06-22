import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    console.log("🧪 Testing Groq API connection...")

    // Check if Groq API key exists
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({
        success: false,
        error: "GROQ_API_KEY environment variable is not set",
      })
    }

    // Decode the base64 encoded API key
    let groqApiKey: string
    try {
      groqApiKey = Buffer.from(process.env.GROQ_API_KEY, "base64").toString("utf-8")
      console.log("✅ Groq API key decoded:", groqApiKey.substring(0, 10) + "...")
    } catch (decodeError) {
      return NextResponse.json({
        success: false,
        error: "Failed to decode Groq API key",
      })
    }

    // Test API call
    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-70b-versatile",
        messages: [
          {
            role: "user",
            content: "Say hello! This is a test.",
          },
        ],
        max_tokens: 50,
      }),
    })

    console.log("📡 Groq test response status:", groqResponse.status)

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text()
      console.error("❌ Groq API test error:", errorText)
      return NextResponse.json({
        success: false,
        error: `Groq API error: ${groqResponse.status}`,
        details: errorText,
      })
    }

    const groqData = await groqResponse.json()
    const testResponse = groqData.choices[0]?.message?.content

    return NextResponse.json({
      success: true,
      message: "Groq API is working!",
      testResponse: testResponse,
      model: "llama-3.1-70b-versatile",
    })
  } catch (error) {
    console.error("❌ Groq test error:", error)
    return NextResponse.json({
      success: false,
      error: "Test failed",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
