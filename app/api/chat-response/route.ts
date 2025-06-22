import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "No message provided" }, { status: 400 })
    }

    console.log("🎤 User said:", message)

    // Check if Groq API key exists
    if (!process.env.GROQ_API_KEY) {
      console.error("GROQ_API_KEY environment variable is not set")
      return NextResponse.json({ error: "Groq API key not configured" }, { status: 500 })
    }

    // Handle API key - try direct first, then base64 decode
    let groqApiKey: string
    const rawKey = process.env.GROQ_API_KEY

    if (rawKey.startsWith("gsk_")) {
      groqApiKey = rawKey
      console.log("✅ Using Groq key directly")
    } else {
      try {
        groqApiKey = Buffer.from(rawKey, "base64").toString("utf-8")
        console.log("✅ Groq API key decoded from base64")
      } catch (decodeError) {
        console.error("Failed to decode Groq API key:", decodeError)
        groqApiKey = rawKey // Fallback
      }
    }

    console.log("🔑 Using Groq key:", groqApiKey.substring(0, 20) + "...")
    console.log("⚡ Calling Groq API for ultra-fast response...")

    // Call Groq API directly for maximum speed
    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-70b-versatile", // Fast and high-quality model
        messages: [
          {
            role: "system",
            content:
              "You are an AI assistant having a natural voice conversation. Keep responses conversational, engaging, and concise (1-3 sentences) since this is real-time voice chat. Be friendly, intelligent, and respond directly to what the user said. Make the conversation feel natural and flowing. Don't make assumptions about whose voice you're using - just focus on having a great conversation.",
          },
          {
            role: "user",
            content: message,
          },
        ],
        max_tokens: 150,
        temperature: 0.7,
        stream: false,
      }),
    })

    console.log("📡 Groq response status:", groqResponse.status)

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text()
      console.error("❌ Groq API error:", groqResponse.status, errorText)

      // Return a helpful error message
      return NextResponse.json({
        response: "I'm having trouble connecting to my AI brain right now. Let me try again in a moment.",
        timestamp: new Date().toISOString(),
        success: true,
        fallback: true,
      })
    }

    const groqData = await groqResponse.json()
    console.log("📡 Groq full response:", groqData)

    const aiResponse = groqData.choices[0]?.message?.content || "I heard you, but I'm not sure how to respond."

    console.log("💬 Groq response:", aiResponse)

    return NextResponse.json({
      response: aiResponse,
      timestamp: new Date().toISOString(),
      success: true,
      provider: "groq",
      model: "llama-3.1-70b-versatile",
    })
  } catch (error) {
    console.error("❌ Chat response error:", error)

    // Return a simple fallback response
    return NextResponse.json({
      response: "That's interesting! Tell me more about that.",
      timestamp: new Date().toISOString(),
      success: true,
      fallback: true,
    })
  }
}
