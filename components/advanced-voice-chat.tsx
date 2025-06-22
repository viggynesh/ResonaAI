"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mic, MicOff, Phone, PhoneOff, Settings } from "lucide-react"

interface AdvancedVoiceChatProps {
  customVoiceId?: string
}

export default function AdvancedVoiceChat({ customVoiceId }: AdvancedVoiceChatProps) {
  const [isCallActive, setIsCallActive] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [vapi, setVapi] = useState<any>(null)
  const [voiceId, setVoiceId] = useState(customVoiceId || "21m00Tcm4TlvDq8ikWAM")
  const [systemPrompt, setSystemPrompt] = useState(
    "You are a helpful AI assistant. Keep responses conversational and concise.",
  )

  useEffect(() => {
    // Load VAPI SDK
    const script = document.createElement("script")
    script.src = "https://cdn.jsdelivr.net/npm/@vapi-ai/web@latest/dist/index.js"
    script.onload = () => {
      const vapiInstance = new (window as any).Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY)
      setVapi(vapiInstance)

      vapiInstance.on("call-start", () => {
        setIsCallActive(true)
        setIsConnecting(false)
      })

      vapiInstance.on("call-end", () => {
        setIsCallActive(false)
        setIsConnecting(false)
      })

      vapiInstance.on("error", (error: any) => {
        console.error("VAPI Error:", error)
        setIsConnecting(false)
        setIsCallActive(false)
      })

      vapiInstance.on("speech-start", () => {
        console.log("User started speaking")
      })

      vapiInstance.on("speech-end", () => {
        console.log("User stopped speaking")
      })
    }
    document.head.appendChild(script)

    return () => {
      if (vapi) {
        vapi.stop()
      }
    }
  }, [])

  const startCall = async () => {
    if (!vapi) return

    setIsConnecting(true)

    try {
      await vapi.start({
        model: {
          provider: "openai",
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
          ],
          temperature: 0.7,
        },
        voice: {
          provider: "11labs",
          voiceId: voiceId,
          model: "eleven_multilingual_v2",
          stability: 0.5,
          similarityBoost: 0.8,
          style: 0.5,
          useSpeakerBoost: true,
        },
        transcriber: {
          provider: "deepgram",
          model: "nova-2",
          language: "en-US",
          smartFormat: true,
        },
        firstMessage: "Hello! I'm ready to chat with you. What would you like to talk about?",
        endCallMessage: "Thanks for the conversation! Talk to you later!",
        recordingEnabled: false,
        silenceTimeoutSeconds: 30,
        maxDurationSeconds: 1800, // 30 minutes
        backgroundSound: "office",
      })
    } catch (error) {
      console.error("Failed to start call:", error)
      setIsConnecting(false)
      alert("Failed to start call. Please check your microphone permissions.")
    }
  }

  const endCall = () => {
    if (vapi && isCallActive) {
      vapi.stop()
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Voice Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="voiceId">ElevenLabs Voice ID</Label>
            <Input
              id="voiceId"
              value={voiceId}
              onChange={(e) => setVoiceId(e.target.value)}
              placeholder="Enter ElevenLabs voice ID"
              disabled={isCallActive}
            />
            <p className="text-xs text-gray-500 mt-1">Use your custom voice ID or default: 21m00Tcm4TlvDq8ikWAM</p>
          </div>

          <div>
            <Label htmlFor="systemPrompt">AI Personality</Label>
            <textarea
              id="systemPrompt"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="w-full p-2 border rounded-md text-sm"
              rows={3}
              disabled={isCallActive}
              placeholder="Describe how the AI should behave..."
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">AI Voice Chat</CardTitle>
          <p className="text-gray-600">Real-time voice conversation with AI</p>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="flex justify-center">
            <div
              className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${
                isCallActive ? "bg-green-100 animate-pulse" : isConnecting ? "bg-yellow-100" : "bg-gray-100"
              }`}
            >
              {isConnecting ? (
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
              ) : isCallActive ? (
                <Mic className="w-16 h-16 text-green-600" />
              ) : (
                <MicOff className="w-16 h-16 text-gray-400" />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-lg font-medium">
              {isConnecting ? "Connecting..." : isCallActive ? "Live Conversation" : "Ready to Chat"}
            </p>
            <p className="text-sm text-gray-500">
              {isCallActive
                ? "Speak naturally - AI will respond with voice"
                : "Click start to begin your voice conversation"}
            </p>
          </div>

          {!isCallActive && !isConnecting && (
            <Button
              onClick={startCall}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 text-lg"
              size="lg"
            >
              <Phone className="w-5 h-5 mr-2" />
              Start Voice Chat
            </Button>
          )}

          {(isCallActive || isConnecting) && (
            <Button onClick={endCall} className="w-full bg-red-500 hover:bg-red-600 text-white py-3 text-lg" size="lg">
              <PhoneOff className="w-5 h-5 mr-2" />
              End Call
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
