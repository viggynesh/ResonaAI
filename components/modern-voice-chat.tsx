"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Mic, MicOff, Phone, PhoneOff, Volume2, User, Bot, Sparkles, Zap } from "lucide-react"

interface ModernVoiceChatProps {
  voiceId: string
  sampleAudioUrl: string
}

export default function ModernVoiceChat({ voiceId, sampleAudioUrl }: ModernVoiceChatProps) {
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
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="font-display text-4xl font-bold text-white mb-4">Chat with Your AI Twin</h2>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Experience the magic of hearing your own voice powered by advanced AI
        </p>
      </div>

      <Card className="glass-effect border-white/20 shadow-2xl">
        <CardContent className="p-8">
          {/* Voice Clone Info */}
          <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <Volume2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Your Voice Clone Active</h3>
                  <p className="text-green-300 text-sm">Powered by ElevenLabs Neural Technology</p>
                </div>
              </div>
              <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                <Zap className="w-3 h-3 mr-1" />
                Live
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="text-gray-300">
                <span className="text-gray-400">Voice ID:</span> {voiceId.slice(-8)}...
              </div>
              <div className="text-gray-300">
                <span className="text-gray-400">Quality:</span> Neural HD
              </div>
            </div>

            <div className="mt-4">
              <p className="text-gray-400 text-sm mb-2">Original Voice Sample:</p>
              <audio controls src={sampleAudioUrl} className="w-full h-10 rounded-lg" />
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-red-400" />
              </div>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Chat Status */}
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <div
                className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 ${
                  isSpeaking
                    ? "bg-gradient-to-br from-green-500 to-emerald-500 animate-pulse scale-110 shadow-2xl shadow-green-500/50"
                    : isListening
                      ? "bg-gradient-to-br from-blue-500 to-cyan-500 animate-pulse scale-105 shadow-xl shadow-blue-500/30"
                      : "bg-gradient-to-br from-gray-600 to-gray-700 shadow-lg"
                }`}
              >
                {isSpeaking ? (
                  <Volume2 className="w-12 h-12 text-white" />
                ) : isListening ? (
                  <Mic className="w-12 h-12 text-white" />
                ) : (
                  <MicOff className="w-12 h-12 text-white" />
                )}
              </div>

              {/* Status indicator */}
              <div
                className={`absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center ${
                  isActive ? "bg-green-500" : "bg-gray-500"
                }`}
              >
                <div className="w-3 h-3 bg-white rounded-full"></div>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-2xl font-semibold text-white mb-2">
                {isSpeaking
                  ? "🗣️ AI Speaking (Your Voice!)"
                  : isListening
                    ? "👂 Listening..."
                    : isActive
                      ? "Ready to Chat"
                      : "Voice Chat Inactive"}
              </h3>
              <p className="text-gray-400">
                {isActive
                  ? "The AI will respond using your actual cloned voice"
                  : "Start the conversation to hear yourself talk back"}
              </p>
            </div>
          </div>

          {/* Current Response Display */}
          {currentResponse && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center mt-1">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-blue-300 text-sm font-medium mb-1">AI is saying (with your voice):</p>
                  <p className="text-white">"{currentResponse}"</p>
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.length > 0 && (
            <div className="bg-gray-800/30 rounded-2xl p-6 max-h-80 overflow-y-auto space-y-4 mb-8 border border-gray-700/30">
              <h4 className="font-semibold text-white flex items-center">
                <Sparkles className="w-4 h-4 mr-2 text-purple-400" />
                Conversation History
              </h4>
              {messages.slice(-6).map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl p-4 ${
                      msg.role === "user"
                        ? "bg-gradient-to-br from-purple-600 to-blue-600 text-white"
                        : "bg-gray-700/50 border border-gray-600/50 text-white"
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center mt-1 ${
                          msg.role === "assistant" ? "bg-green-500/20" : "bg-purple-500/20"
                        }`}
                      >
                        {msg.role === "assistant" ? (
                          <Bot className="w-3 h-3 text-green-400" />
                        ) : (
                          <User className="w-3 h-3 text-purple-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">{msg.content}</p>
                        {msg.audioUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => playClonedVoiceAudio(msg.audioUrl!)}
                            className="mt-2 p-2 h-auto text-xs hover:bg-white/10"
                          >
                            <Volume2 className="w-3 h-3 mr-1" />
                            Replay
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Controls */}
          <div className="space-y-4">
            {!isActive && (
              <Button
                onClick={startChat}
                size="lg"
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-4 text-lg font-semibold rounded-xl shadow-xl hover:shadow-purple-500/25 transition-all duration-300 group"
              >
                <Phone className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                Start Voice Chat with Your Clone
                <Sparkles className="w-5 h-5 ml-2" />
              </Button>
            )}

            {isActive && (
              <Button
                onClick={stopChat}
                size="lg"
                className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white py-4 text-lg font-semibold rounded-xl shadow-xl hover:shadow-red-500/25 transition-all duration-300"
              >
                <PhoneOff className="w-5 h-5 mr-2" />
                End Chat
              </Button>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/30">
              <Mic className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <p className="text-white text-sm font-medium mb-1">Speak Naturally</p>
              <p className="text-gray-400 text-xs">Talk as you normally would</p>
            </div>
            <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/30">
              <Volume2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-white text-sm font-medium mb-1">Hear Your Voice</p>
              <p className="text-gray-400 text-xs">AI responds with your clone</p>
            </div>
            <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/30">
              <Sparkles className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <p className="text-white text-sm font-medium mb-1">Real-time Magic</p>
              <p className="text-gray-400 text-xs">Instant AI conversations</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
