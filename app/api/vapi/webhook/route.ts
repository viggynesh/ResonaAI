import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("VAPI Webhook received:", body.type)

    switch (body.type) {
      case "function-call":
        // Handle function calls if you want to add custom functions
        return handleFunctionCall(body)

      case "assistant-request":
        // Handle custom assistant requests
        return handleAssistantRequest(body)

      case "end-of-call-report":
        // Handle call end reports
        console.log("Call ended:", body.call)
        break

      default:
        console.log("Unhandled webhook type:", body.type)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("VAPI webhook error:", error)
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 })
  }
}

async function handleFunctionCall(body: any) {
  // You can add custom functions here
  return NextResponse.json({
    result: "Function executed successfully",
  })
}

async function handleAssistantRequest(body: any) {
  // Use Claude for more advanced responses if needed
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "Claude API not configured" }, { status: 500 })
    }

    const anthropicApiKey = Buffer.from(process.env.ANTHROPIC_API_KEY, "base64").toString("utf-8")

    // You can customize the assistant behavior here
    return NextResponse.json({
      assistant: {
        model: {
          provider: "openai",
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content:
                "You are a helpful AI assistant. Keep responses conversational, friendly, and concise since this is a voice conversation.",
            },
          ],
        },
      },
    })
  } catch (error) {
    console.error("Assistant request error:", error)
    return NextResponse.json({ error: "Assistant request failed" }, { status: 500 })
  }
}
