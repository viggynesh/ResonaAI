"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mic, MicOff, Phone, PhoneOff } from "lucide-react"

interface VoiceChatProps {
  clonedVoiceId: string
}

export default function VoiceChat({ clonedVoiceId }: VoiceChatProps) {
  const [vapi, setVapi] = useState<any>(null)
  const [isCallActive, setIsCallActive] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadVapi = async () => {
      try {
        const { default: Vapi } = await import("@vapi-ai/web")
        const publicKey = "f7da96a8-9ac7-4714-81a6-da1ad1b97d02"
        const vapiInstance = new Vapi(publicKey)

        vapiInstance.on("call-start", () => {
          setIsCallActive(true)
          setIsLoading(false)
          setError(null)
        })

        vapiInstance.on("call-end", () => {
          setIsCallActive(false)
          setIsLoading(false)
        })

        vapiInstance.on("error", (error: any) => {
          console.error("VAPI Error:", error)
          setError(`Call failed: ${error.message || "Unknown error"}`)
          setIsCallActive(false)
          setIsLoading(false)
        })

        setVapi(vapiInstance)
      } catch (error) {
        console.error("Failed to load VAPI:", error)
        setError("Failed to initialize voice chat")
      }
    }

    loadVapi()
  }, [])

  const startCall = async () => {
    if (!vapi) return

    setIsLoading(true)
    setError(null)

    try {
      await vapi.start({
        model: {
          provider: "openai",
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content:
                "You are a helpful AI assistant speaking with the user's own cloned voice. Keep responses conversational and natural since this is a voice conversation.",
            },
          ],
          temperature: 0.7,
        },
        voice: {
          provider: "custom",
          voiceId: clonedVoiceId,
          url: `/api/voice-synthesis/${clonedVoiceId}`,
        },
        transcriber: {
          provider: "deepgram",
          model: "nova-2",
          language: "en-US",
        },
        firstMessage: "Hello! I'm speaking with your cloned voice. How does it sound?",
        endCallMessage: "Thanks for testing the voice clone! Goodbye!",
        recordingEnabled: false,
        silenceTimeoutSeconds: 30,
        maxDurationSeconds: 600,
      })
    } catch (error: any) {
      console.error("Failed to start call:", error)
      setError(`Failed to start call: ${error.message}`)
      setIsLoading(false)
    }
  }

  const endCall = () => {
    if (vapi && isCallActive) {
      vapi.stop()
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Voice Chat with Your Clone</CardTitle>
        <p className="text-gray-600">The AI will speak using your cloned voice</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <div
            className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center transition-all duration-300 ${
              isCallActive ? "bg-green-100 animate-pulse" : isLoading ? "bg-yellow-100" : "bg-gray-100"
            }`}
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            ) : isCallActive ? (
              <Mic className="w-12 h-12 text-green-600" />
            ) : (
              <MicOff className="w-12 h-12 text-gray-400" />
            )}
          </div>

          <div className="mt-4">
            <p className="text-lg font-medium">
              {isLoading ? "Connecting..." : isCallActive ? "🎙️ Live Chat" : "Ready to Chat"}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {isCallActive ? "AI is speaking with your voice!" : "Start conversation with your voice clone"}
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-3">
          {!isCallActive && !isLoading && (
            <Button onClick={startCall} className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3" size="lg">
              <Phone className="w-5 h-5 mr-2" />
              Start Voice Chat
            </Button>
          )}

          {(isCallActive || isLoading) && (
            <Button onClick={endCall} className="w-full bg-red-500 hover:bg-red-600 text-white py-3" size="lg">
              <PhoneOff className="w-5 h-5 mr-2" />
              End Call
            </Button>
          )}
        </div>

        <div className="text-center text-xs text-gray-500 space-y-1">
          <p>• Voice ID: {clonedVoiceId}</p>
          <p>• AI responses will use your cloned voice</p>
        </div>
      </CardContent>
    </Card>
  )
}
