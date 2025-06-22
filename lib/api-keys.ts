// Utility functions for securely handling API keys
export function decodeApiKey(encodedKey: string): string {
  try {
    return Buffer.from(encodedKey, "base64").toString("utf-8")
  } catch (error) {
    console.error("Failed to decode API key:", error)
    throw new Error("Invalid API key format")
  }
}

export function encodeApiKey(key: string): string {
  return Buffer.from(key, "utf-8").toString("base64")
}

// Validate that all required API keys are present
export function validateApiKeys() {
  const requiredKeys = [
    "VAPI_PRIVATE_KEY",
    "VAPI_PUBLIC_KEY",
    "GROQ_API_KEY",
    "ANTHROPIC_API_KEY",
    "ELEVENLABS_API_KEY",
  ]

  const missingKeys = requiredKeys.filter((key) => !process.env[key])

  if (missingKeys.length > 0) {
    throw new Error(`Missing required environment variables: ${missingKeys.join(", ")}`)
  }
}
