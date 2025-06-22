"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Mic, MicOff, Phone, PhoneOff, Volume2, User, Bot } from "lucide-react"

interface ProfessionalVoiceChatProps {
  voiceId: string
  sampleAudioUrl: string
}

export default function ProfessionalVoiceChat({ voiceId, sampleAudioUrl }: ProfessionalVoiceChatProps) {
  const [isActive, setIsActive] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [messages, setMessages] = useState<Array<{ id: string; role: string; content: string; audioUrl?: string }>>([])
  const [error, setError] = useState<string | null>(null)
  const [currentResponse, setCurrentResponse] = useState<string>("")

  const recognitionRef = useRef<any>(null)
  const isProcessingRef = useRef(false)

  useEffect(() => {
    const initSpeechRecognition = () => {
      if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
        const recognition = new SpeechRecognition()

        recognition.continuous = false
        recognition.interimResults = false
        recognition.lang = "en-US"

        recognition.onstart = () => {
          setIsListening(true)
          setError(null)
        }

        recognition.onend = () => {
          setIsListening(false)
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

          if (transcript.length > 0 && !isProcessingRef.current) {
            isProcessingRef.current = true

            const userMessage = {
              id: Date.now().toString(),
              role: "user",
              content: transcript,
            }

            setMessages((prev) => [...prev, userMessage])

            try {
              const aiResponse = await getAIResponse(transcript)

              const assistantMessage = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: aiResponse.message,
                audioUrl: aiResponse.audioUrl,
              }

              setMessages((prev) => [...prev, assistantMessage])
              setCurrentResponse(aiResponse.message)

              if (aiResponse.audioUrl) {
                await playClonedVoiceAudio(aiResponse.audioUrl)
              }
            } catch (error) {
              setError("Failed to get AI response")
            } finally {
              isProcessingRef.current = false
              setCurrentResponse("")
            }
          }
        }

        recognition.onerror = (event: any) => {
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

      try {
        recognitionRef.current.start()
      } catch (error) {
        setError("Failed to start speech recognition")
      }
    } else {
      setError("Speech recognition not available. Please use Chrome or Edge.")
    }
  }

  const stopChat = () => {
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

      if (response.ok) {
        const data = await response.json()
        return {
          message: data.message || "I heard you, but I'm not sure how to respond.",
          audioUrl: data.audioUrl,
        }
      } else {
        throw new Error(`API error: ${response.status}`)
      }
    } catch (error) {
      throw error
    }
  }

  const playClonedVoiceAudio = async (audioUrl: string): Promise<void> => {
    return new Promise((resolve) => {
      setIsSpeaking(true)
      const audio = new Audio(audioUrl)

      audio.oncanplay = () => {
        audio.play()
      }

      audio.onended = () => {
        setIsSpeaking(false)
        resolve()
      }

      audio.onerror = () => {
        setIsSpeaking(false)
        resolve()
      }
    })
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Chat with Your AI Twin</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Experience AI conversation powered by your own cloned voice
        </p>
      </div>

      <Card className="shadow-xl border-gray-200">
        <CardHeader>
          <CardTitle className="text-xl text-gray-900 flex items-center justify-between">
            Voice Chat
            <Badge className="bg-green-100 text-green-700 border-green-200">ElevenLabs Active</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {/* Voice Clone Info */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <Volume2 className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800">Your Voice Clone Active</span>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                Neural HD
              </Badge>
            </div>
            <div className="text-sm text-green-700 mb-3">
              Voice ID: {voiceId.slice(-8)}... | The AI will respond using your actual cloned voice
            </div>
            <audio controls src={sampleAudioUrl} className="w-full h-8" />
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Chat Status */}
          <div className="text-center mb-6">
            <div
              className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 transition-all ${
                isSpeaking
                  ? "bg-green-100 border-4 border-green-300"
                  : isListening
                    ? "bg-blue-100 border-4 border-blue-300"
                    : "bg-gray-100 border-4 border-gray-300"
              }`}
            >
              {isSpeaking ? (
                <Volume2 className="w-8 h-8 text-green-600" />
              ) : isListening ? (
                <Mic className="w-8 h-8 text-blue-600" />
              ) : (
                <MicOff className="w-8 h-8 text-gray-500" />
              )}
            </div>

            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {isSpeaking
                ? "AI Speaking (Your Voice)"
                : isListening
                  ? "Listening..."
                  : isActive
                    ? "Ready to Chat"
                    : "Voice Chat Inactive"}
            </h3>
            <p className="text-gray-600">
              {isActive
                ? "The AI will respond using your cloned voice"
                : "Start the conversation to hear yourself talk back"}
            </p>
          </div>

          {/* Current Response */}
          {currentResponse && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-800 text-sm font-medium mb-1">AI is saying (with your voice):</p>
              <p className="text-blue-900">"{currentResponse}"</p>
            </div>
          )}

          {/* Messages */}
          {messages.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto space-y-3 mb-6">
              <h4 className="font-medium text-gray-900">Conversation:</h4>
              {messages.slice(-6).map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.role === "user" ? "bg-purple-600 text-white" : "bg-white border border-gray-200"
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center mt-1">
                        {msg.role === "assistant" ? (
                          <Bot className="w-3 h-3 text-gray-600" />
                        ) : (
                          <User className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">{msg.content}</p>
                        {msg.audioUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => playClonedVoiceAudio(msg.audioUrl!)}
                            className="mt-2 p-1 h-auto text-xs"
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
          <div className="space-y-3">
            {!isActive && (
              <Button
                onClick={startChat}
                size="lg"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3"
              >
                <Phone className="w-5 h-5 mr-2" />
                Start Voice Chat with Your Clone
              </Button>
            )}

            {isActive && (
              <Button onClick={stopChat} size="lg" className="w-full bg-red-600 hover:bg-red-700 text-white py-3">
                <PhoneOff className="w-5 h-5 mr-2" />
                End Chat
              </Button>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-center text-sm text-gray-600">
            <div>
              <Mic className="w-6 h-6 text-purple-500 mx-auto mb-2" />
              <p className="font-medium">Speak Naturally</p>
              <p>Talk as you normally would</p>
            </div>
            <div>
              <Volume2 className="w-6 h-6 text-green-500 mx-auto mb-2" />
              <p className="font-medium">Hear Your Voice</p>
              <p>AI responds with your clone</p>
            </div>
            <div>
              <Bot className="w-6 h-6 text-blue-500 mx-auto mb-2" />
              <p className="font-medium">Real-time AI</p>
              <p>Instant conversations</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
