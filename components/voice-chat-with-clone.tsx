"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Mic, MicOff, Phone, PhoneOff, Volume2, User, Bot } from "lucide-react"

interface VoiceChatWithCloneProps {
  voiceId: string
  sampleAudioUrl: string
}

export default function VoiceChatWithClone({ voiceId, sampleAudioUrl }: VoiceChatWithCloneProps) {
  const [isActive, setIsActive] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [messages, setMessages] = useState<Array<{ id: string; role: string; content: string; audioUrl?: string }>>([])
  const [error, setError] = useState<string | null>(null)
  const [currentResponse, setCurrentResponse] = useState<string>("")

  const recognitionRef = useRef<any>(null)
  const isProcessingRef = useRef(false)

  useEffect(() => {
    // Initialize speech recognition
    const initSpeechRecognition = () => {
      if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
        const recognition = new SpeechRecognition()

        recognition.continuous = false
        recognition.interimResults = false
        recognition.lang = "en-US"

        recognition.onstart = () => {
          console.log("🎤 Speech recognition started")
          setIsListening(true)
          setError(null)
        }

        recognition.onend = () => {
          console.log("🎤 Speech recognition ended")
          setIsListening(false)

          // Restart listening if still active and not processing
          if (isActive && !isProcessingRef.current && !isSpeaking) {
            setTimeout(() => {
              if (isActive && !isProcessingRef.current && !isSpeaking) {
                try {
                  recognition.start()
                } catch (e) {
                  console.log("Recognition restart failed:", e)
                }
              }
            }, 1000)
          }
        }

        recognition.onresult = async (event: any) => {
          const transcript = event.results[event.results.length - 1][0].transcript.trim()
          console.log("🎤 User said:", transcript)

          if (transcript.length > 0 && !isProcessingRef.current) {
            isProcessingRef.current = true

            const userMessage = {
              id: Date.now().toString(),
              role: "user",
              content: transcript,
            }

            setMessages((prev) => [...prev, userMessage])

            try {
              // Get AI response
              console.log("🤖 Getting AI response...")
              const aiResponse = await getAIResponse(transcript)
              console.log("💬 AI response:", aiResponse.message)

              const assistantMessage = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: aiResponse.message,
                audioUrl: aiResponse.audioUrl,
              }

              setMessages((prev) => [...prev, assistantMessage])
              setCurrentResponse(aiResponse.message)

              // Play the audio with your cloned voice
              if (aiResponse.audioUrl) {
                console.log("🗣️ Playing cloned voice audio...")
                await playClonedVoiceAudio(aiResponse.audioUrl)
              }
            } catch (error) {
              console.error("❌ Error in conversation:", error)
              setError("Failed to get AI response")
            } finally {
              isProcessingRef.current = false
              setCurrentResponse("")
            }
          }
        }

        recognition.onerror = (event: any) => {
          console.error("❌ Speech recognition error:", event.error)
          setError(`Speech recognition error: ${event.error}`)
          setIsListening(false)
          isProcessingRef.current = false
        }

        recognitionRef.current = recognition
      } else {
        setError("Speech recognition not supported in this browser")
      }
    }

    initSpeechRecognition()

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [isActive, isSpeaking])

  const startChat = () => {
    if (recognitionRef.current) {
      setIsActive(true)
      setMessages([
        {
          id: "1",
          role: "assistant",
          content:
            "Hello! I'm speaking with your cloned voice now. How does it sound? What would you like to talk about?",
        },
      ])
      setError(null)
      isProcessingRef.current = false
      console.log("🚀 Starting voice chat with your cloned voice...")

      try {
        recognitionRef.current.start()
      } catch (error) {
        console.error("Failed to start recognition:", error)
        setError("Failed to start speech recognition")
      }
    } else {
      setError("Speech recognition not available. Please use Chrome or Edge.")
    }
  }

  const stopChat = () => {
    console.log("🛑 Stopping voice chat...")
    setIsActive(false)
    isProcessingRef.current = false

    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }

    setIsListening(false)
    setIsSpeaking(false)
    setError(null)
  }

  const getAIResponse = async (userInput: string) => {
    try {
      console.log("📡 Sending to chat API:", userInput)

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: userInput }],
          personality: "You are speaking with the user's own cloned voice. Be conversational and engaging.",
          voiceId: voiceId,
          audioEnabled: true,
        }),
      })

      console.log("📡 API response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("📡 API response data:", data)
        return {
          message: data.message || "I heard you, but I'm not sure how to respond.",
          audioUrl: data.audioUrl,
        }
      } else {
        const errorData = await response.json()
        console.error("❌ API error:", response.status, errorData)
        throw new Error(`API error: ${response.status}`)
      }
    } catch (error) {
      console.error("❌ Network error:", error)
      throw error
    }
  }

  const playClonedVoiceAudio = async (audioUrl: string): Promise<void> => {
    return new Promise((resolve) => {
      setIsSpeaking(true)

      const audio = new Audio(audioUrl)

      audio.onloadstart = () => {
        console.log("🎵 Loading cloned voice audio...")
      }

      audio.oncanplay = () => {
        console.log("🗣️ Playing your cloned voice...")
        audio.play()
      }

      audio.onended = () => {
        console.log("✅ Cloned voice audio finished")
        setIsSpeaking(false)
        resolve()
      }

      audio.onerror = (error) => {
        console.error("❌ Audio playback error:", error)
        setIsSpeaking(false)
        resolve()
      }
    })
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Chat with Your Voice Clone</CardTitle>
        <p className="text-gray-600">AI powered by Claude, speaking with YOUR voice</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Voice Clone Info */}
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Volume2 className="w-5 h-5 text-green-500" />
              <span className="font-medium">Your Voice Clone Active</span>
            </div>
            <Badge variant="secondary">ElevenLabs</Badge>
          </div>
          <div className="text-sm text-gray-600">
            <p>Voice ID: {voiceId}</p>
            <p>The AI will respond using your actual cloned voice!</p>
          </div>
          <audio controls src={sampleAudioUrl} className="w-full mt-2 h-8" />
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Chat Status */}
        <div className="text-center">
          <div
            className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center transition-all duration-300 ${
              isSpeaking ? "bg-green-100 animate-pulse" : isListening ? "bg-blue-100 animate-pulse" : "bg-gray-100"
            }`}
          >
            {isSpeaking ? (
              <Volume2 className="w-12 h-12 text-green-600" />
            ) : isListening ? (
              <Mic className="w-12 h-12 text-blue-600" />
            ) : (
              <MicOff className="w-12 h-12 text-gray-400" />
            )}
          </div>

          <div className="mt-4">
            <p className="text-lg font-medium">
              {isSpeaking
                ? "🗣️ AI Speaking (Your Voice!)"
                : isListening
                  ? "👂 Listening..."
                  : isActive
                    ? "Ready"
                    : "Inactive"}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {isActive
                ? "The AI will respond using your actual cloned voice"
                : "Start chat to hear the AI speak with your voice"}
            </p>
          </div>
        </div>

        {/* Current Response Display */}
        {currentResponse && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm font-medium text-blue-800 mb-1">🤖 AI is saying (with your voice):</p>
            <p className="text-sm text-blue-700">"{currentResponse}"</p>
          </div>
        )}

        {/* Messages */}
        {messages.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto space-y-3">
            <h4 className="font-medium">Conversation:</h4>
            {messages.slice(-6).map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    msg.role === "user" ? "bg-blue-500 text-white" : "bg-white border"
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {msg.role === "assistant" ? (
                      <Bot className="w-4 h-4 mt-1 flex-shrink-0" />
                    ) : (
                      <User className="w-4 h-4 mt-1 flex-shrink-0" />
                    )}
                    <p className="text-sm">{msg.content}</p>
                  </div>
                  {msg.audioUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => playClonedVoiceAudio(msg.audioUrl!)}
                      className="mt-2 p-1 h-auto"
                    >
                      <Volume2 className="w-3 h-3 mr-1" />
                      Replay
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Controls */}
        <div className="space-y-3">
          {!isActive && (
            <Button onClick={startChat} className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3" size="lg">
              <Phone className="w-5 h-5 mr-2" />
              Start Voice Chat with Your Clone
            </Button>
          )}

          {isActive && (
            <Button onClick={stopChat} className="w-full bg-red-500 hover:bg-red-600 text-white py-3" size="lg">
              <PhoneOff className="w-5 h-5 mr-2" />
              End Chat
            </Button>
          )}
        </div>

        {/* Instructions */}
        <div className="text-center text-xs text-gray-500 space-y-1">
          <p>• The AI uses your actual cloned voice from ElevenLabs</p>
          <p>• Speak naturally and wait for the AI to respond</p>
          <p>• You'll hear your own voice talking back to you!</p>
        </div>
      </CardContent>
    </Card>
  )
}
