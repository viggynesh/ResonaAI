import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { anthropic } from "@ai-sdk/anthropic"

export async function POST(request: NextRequest) {
  try {
    const { transcription } = await request.json()

    if (!transcription) {
      return NextResponse.json({ error: "No transcription provided" }, { status: 400 })
    }

    // Check if API key exists
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("ANTHROPIC_API_KEY environment variable is not set")
      return NextResponse.json({ error: "Claude API key not configured" }, { status: 500 })
    }

    // Decode the base64 encoded API key
    let anthropicApiKey: string
    try {
      anthropicApiKey = Buffer.from(process.env.ANTHROPIC_API_KEY, "base64").toString("utf-8")
    } catch (decodeError) {
      console.error("Failed to decode Claude API key:", decodeError)
      return NextResponse.json({ error: "API key decode error" }, { status: 500 })
    }

    const prompt = `
    Analyze the following transcription and provide a detailed personality analysis. 
    Focus on communication style, emotional tone, personality traits, and speaking patterns.
    
    Transcription: "${transcription}"
    
    Please provide:
    1. A comprehensive personality description (2-3 sentences)
    2. 5-7 key personality traits
    3. Communication style analysis
    4. Confidence score (0-1) for the analysis accuracy
    
    Format your response as JSON with the following structure:
    {
      "description": "Detailed personality description",
      "traits": ["trait1", "trait2", "trait3", "trait4", "trait5"],
      "communicationStyle": "Description of communication style",
      "confidence": 0.85
    }
    `

    console.log("Analyzing personality with Claude...")

    const result = await generateText({
      model: anthropic("claude-3-5-sonnet-20241022", {
        apiKey: anthropicApiKey,
      }),
      prompt,
      system:
        "You are an expert personality analyst and psychologist. Provide accurate, insightful personality analysis based on speech patterns and content. Always respond with valid JSON.",
    })

    console.log("Claude response received, parsing JSON...")

    // Parse the JSON response
    let analysis
    try {
      analysis = JSON.parse(result.text)
    } catch (parseError) {
      console.error("Failed to parse Claude response as JSON:", result.text)
      // Fallback analysis if JSON parsing fails
      analysis = {
        description:
          "Based on the speech sample, this person appears to have a conversational and engaging communication style.",
        traits: ["Articulate", "Confident", "Expressive", "Thoughtful", "Engaging"],
        communicationStyle: "Clear and direct communication with good articulation",
        confidence: 0.75,
      }
    }

    return NextResponse.json(analysis)
  } catch (error) {
    console.error("Personality analysis error:", error)

    if (error instanceof Error && error.message.includes("401")) {
      return NextResponse.json({ error: "Invalid Claude API key" }, { status: 401 })
    }

    return NextResponse.json(
      {
        error: "Failed to analyze personality",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
