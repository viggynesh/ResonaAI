"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Mic, MicOff, Phone, PhoneOff, Volume2 } from "lucide-react"

interface ClonedVoiceChatProps {
  voiceData: {
    voiceId: string
    audioUrl: string
    voiceFeatures: any
  }
}

export default function ClonedVoiceChat({ voiceData }: ClonedVoiceChatProps) {
  const [vapi, setVapi] = useState<any>(null)
  const [isCallActive, setIsCallActive] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [callDuration, setCallDuration] = useState(0)

  useEffect(() => {
    const loadVapi = async () => {
      try {
        const { default: Vapi } = await import("@vapi-ai/web")
        const publicKey = "f7da96a8-9ac7-4714-81a6-da1ad1b97d02"
        const vapiInstance = new Vapi(publicKey)

        vapiInstance.on("call-start", () => {
          console.log("Call started with cloned voice")
          setIsCallActive(true)
          setIsConnecting(false)
          setError(null)
          setCallDuration(0)
        })

        vapiInstance.on("call-end", () => {
          console.log("Call ended")
          setIsCallActive(false)
          setIsConnecting(false)
          setCallDuration(0)
        })

        vapiInstance.on("error", (error: any) => {
          console.error("VAPI Error:", error)
          setError(`Call failed: ${error.message || "Unknown error"}`)
          setIsCallActive(false)
          setIsConnecting(false)
        })

        vapiInstance.on("speech-start", () => {
          console.log("User started speaking")
        })

        vapiInstance.on("speech-end", () => {
          console.log("User stopped speaking")
        })

        vapiInstance.on("message", (message: any) => {
          console.log("Message:", message)
        })

        setVapi(vapiInstance)
      } catch (error) {
        console.error("Failed to load VAPI:", error)
        setError("Failed to initialize voice chat")
      }
    }

    loadVapi()

    // Timer for call duration
    let interval: NodeJS.Timeout
    if (isCallActive) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1)
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isCallActive])

  const startCall = async () => {
    if (!vapi) return

    setIsConnecting(true)
    setError(null)

    try {
      // Create custom assistant configuration with cloned voice
      const assistantConfig = {
        model: {
          provider: "openai",
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `You are an AI assistant speaking with the user's own cloned voice. Be conversational, friendly, and natural. Keep responses concise since this is a voice conversation. The user is hearing their own voice speaking back to them, which might be surprising, so acknowledge this unique experience.`,
            },
          ],
          temperature: 0.7,
          maxTokens: 150,
        },
        voice: {
          provider: "custom",
          voiceId: voiceData.voiceId,
          // Use our custom voice synthesis endpoint
          url: `${window.location.origin}/api/synthesize-cloned-voice`,
        },
        transcriber: {
          provider: "deepgram",
          model: "nova-2",
          language: "en-US",
          smartFormat: true,
        },
        firstMessage:
          "Hello! I'm speaking with your cloned voice. Pretty cool, right? What would you like to talk about?",
        endCallMessage: "Thanks for trying out your voice clone! This was fun!",
        recordingEnabled: false,
        silenceTimeoutSeconds: 30,
        maxDurationSeconds: 900, // 15 minutes
        backgroundSound: "off",
      }

      await vapi.start(assistantConfig)
    } catch (error: any) {
      console.error("Failed to start call:", error)
      setError(`Failed to start call: ${error.message || "Please check microphone permissions"}`)
      setIsConnecting(false)
    }
  }

  const endCall = () => {
    if (vapi && isCallActive) {
      vapi.stop()
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Chat with Your Voice Clone</CardTitle>
        <p className="text-gray-600">The AI will respond using your cloned voice</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Voice Info */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Volume2 className="w-5 h-5 text-blue-500" />
              <span className="font-medium">Cloned Voice Active</span>
            </div>
            <Badge variant="secondary">ID: {voiceData.voiceId.slice(-8)}</Badge>
          </div>
          <p className="text-sm text-gray-600">
            Voice features: Pitch {voiceData.voiceFeatures?.pitch?.toFixed(1) || "N/A"}, Tone{" "}
            {voiceData.voiceFeatures?.tone?.toFixed(1) || "N/A"}
          </p>
        </div>

        {/* Call Status */}
        <div className="text-center">
          <div
            className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center transition-all duration-300 ${
              isCallActive ? "bg-green-100 animate-pulse" : isConnecting ? "bg-yellow-100" : "bg-gray-100"
            }`}
          >
            {isConnecting ? (
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            ) : isCallActive ? (
              <Mic className="w-12 h-12 text-green-600" />
            ) : (
              <MicOff className="w-12 h-12 text-gray-400" />
            )}
          </div>

          <div className="mt-4">
            <p className="text-lg font-medium">
              {isConnecting ? "Connecting..." : isCallActive ? "🎙️ Live Chat" : "Ready to Chat"}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {isCallActive
                ? `AI speaking with your voice • ${formatDuration(callDuration)}`
                : "Start conversation with your voice clone"}
            </p>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Controls */}
        <div className="space-y-3">
          {!isCallActive && !isConnecting && (
            <Button onClick={startCall} className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3" size="lg">
              <Phone className="w-5 h-5 mr-2" />
              Start Voice Chat
            </Button>
          )}

          {(isCallActive || isConnecting) && (
            <Button onClick={endCall} className="w-full bg-red-500 hover:bg-red-600 text-white py-3" size="lg">
              <PhoneOff className="w-5 h-5 mr-2" />
              End Call
            </Button>
          )}
        </div>

        {/* Instructions */}
        <div className="text-center text-xs text-gray-500 space-y-1">
          <p>• The AI will respond using your cloned voice</p>
          <p>• Speak naturally and wait for responses</p>
          <p>• Voice quality depends on your original sample</p>
        </div>
      </CardContent>
    </Card>
  )
}
