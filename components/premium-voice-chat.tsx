"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Mic, MicOff, Phone, PhoneOff, Volume2, User, Bot, Sparkles, Zap } from "lucide-react"

interface PremiumVoiceChatProps {
  voiceId: string
  sampleAudioUrl: string
}

export default function PremiumVoiceChat({ voiceId, sampleAudioUrl }: PremiumVoiceChatProps) {
  const [isActive, setIsActive] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [messages, setMessages] = useState<Array<{ id: string; role: string; content: string; audioUrl?: string }>>([])
  const [error, setError] = useState<string | null>(null)
  const [currentResponse, setCurrentResponse] = useState<string>("")
  const [isVisible, setIsVisible] = useState(false)

  const recognitionRef = useRef<any>(null)
  const isProcessingRef = useRef(false)
  const shouldContinueListeningRef = useRef(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  useEffect(() => {
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

          // Only restart if we should continue listening and not currently processing
          if (shouldContinueListeningRef.current && !isProcessingRef.current && !isSpeaking) {
            console.log("🔄 Restarting speech recognition...")
            setTimeout(() => {
              if (shouldContinueListeningRef.current && !isProcessingRef.current && !isSpeaking) {
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
          console.log("🗣️ User said:", transcript)

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
              console.error("❌ AI Response error:", error)
              setError("Failed to get AI response")
            } finally {
              isProcessingRef.current = false
              setCurrentResponse("")
              // Continue listening after AI response is complete
              console.log("✅ Ready for next user input")
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
  }, [isSpeaking])

  const startChat = () => {
    if (recognitionRef.current) {
      setIsActive(true)
      shouldContinueListeningRef.current = true
      setMessages([
        {
          id: "1",
          role: "assistant",
          content: "Hello! I'm ready to chat. What would you like to talk about?",
        },
      ])
      setError(null)
      isProcessingRef.current = false

      try {
        recognitionRef.current.start()
      } catch (error) {
        console.error("❌ Failed to start speech recognition:", error)
        setError("Failed to start speech recognition")
      }
    } else {
      setError("Speech recognition not available. Please use Chrome or Edge.")
    }
  }

  const stopChat = () => {
    console.log("🛑 Stopping chat")
    setIsActive(false)
    shouldContinueListeningRef.current = false
    isProcessingRef.current = false

    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }

    setIsListening(false)
    setIsSpeaking(false)
    setError(null)
  }

  const activateListening = () => {
    if (!isActive) {
      startChat()
    } else if (recognitionRef.current && !isListening && !isProcessingRef.current && !isSpeaking) {
      console.log("🎤 Manually activating listening...")
      shouldContinueListeningRef.current = true
      try {
        recognitionRef.current.start()
      } catch (error) {
        console.error("❌ Failed to activate listening:", error)
        setError("Failed to activate listening")
      }
    }
  }

  const getAIResponse = async (userInput: string) => {
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: userInput }],
          personality: "You are a helpful AI assistant having a natural conversation.",
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
      console.log("🔊 Playing AI response audio")
      setIsSpeaking(true)
      const audio = new Audio(audioUrl)

      audio.oncanplay = () => {
        audio.play()
      }

      audio.onended = () => {
        console.log("🔊 Audio playback finished")
        setIsSpeaking(false)
        resolve()
      }

      audio.onerror = () => {
        console.error("❌ Audio playback error")
        setIsSpeaking(false)
        resolve()
      }
    })
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div
        className={`text-center mb-12 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
      >
        <div className="flowing-line mb-6">
          <h2 className="text-5xl font-bold text-white mb-4">
            Chat with Your <span className="gradient-gold">Cloned Voice</span>
          </h2>
        </div>
        <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
          Experience real-time AI conversation with your perfectly cloned voice
        </p>
      </div>

      <Card
        className={`glass-dark border-yellow-500/20 shadow-2xl transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
        style={{ animationDelay: "0.2s" }}
      >
        <CardHeader>
          <CardTitle className="text-2xl text-white flex items-center justify-between">
            <span className="flex items-center">
              <Zap className="w-6 h-6 mr-3 text-yellow-400" />
              Resona Voice Chat
            </span>
            <Badge className="gradient-gold-bg text-black px-4 py-2">Neural Active</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          {/* Voice Clone Status */}
          <div className="glass-dark border border-green-500/30 rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <Volume2 className="w-6 h-6 text-green-400" />
                <span className="text-xl font-semibold text-green-300">Voice Clone is Active</span>
              </div>
              <Badge className="bg-green-500/20 text-green-300 border border-green-500/30">ElevenLabs Neural HD</Badge>
            </div>
            <div className="text-green-400 mb-4">
              Voice ID: {voiceId.slice(-12)}... | AI responses will use this cloned voice
            </div>
            <audio controls src={sampleAudioUrl} className="w-full h-10 rounded-lg" />
          </div>

          {/* Error Display */}
          {error && (
            <div className="glass-dark border border-red-500/30 rounded-2xl p-6 mb-8">
              <p className="text-red-300 text-lg">{error}</p>
            </div>
          )}

          {/* Chat Status */}
          <div className="text-center mb-8">
            <div
              className={`w-28 h-28 mx-auto rounded-full flex items-center justify-center mb-6 transition-all duration-300 cursor-pointer ${
                isSpeaking
                  ? "glass-dark border-4 border-green-400 glow-gold"
                  : isListening
                    ? "glass-dark border-4 border-blue-400 glow-gold"
                    : "glass-dark border-4 border-gray-500 hover:border-yellow-400"
              }`}
              onClick={activateListening}
            >
              {isSpeaking ? (
                <Volume2 className="w-12 h-12 text-green-400" />
              ) : isListening ? (
                <Mic className="w-12 h-12 text-blue-400" />
              ) : (
                <MicOff className="w-12 h-12 text-gray-500 hover:text-yellow-400" />
              )}
            </div>

            <h3 className="text-2xl font-semibold text-white mb-3">
              {isSpeaking
                ? "AI Speaking (Cloned Voice)"
                : isListening
                  ? "Listening..."
                  : isActive
                    ? "Ready for Conversation"
                    : "Voice Chat Inactive"}
            </h3>
            <p className="text-gray-400 text-lg">
              {isActive
                ? isSpeaking
                  ? "AI is responding with the cloned voice"
                  : isListening
                    ? "Speak now - I'm listening"
                    : "Click the mic above or speak to continue"
                : "Start the conversation to experience voice cloning"}
            </p>
          </div>

          {/* Current Response */}
          {currentResponse && (
            <div className="glass-dark border border-blue-500/30 rounded-2xl p-6 mb-8">
              <div className="flex items-center mb-3">
                <Sparkles className="w-5 h-5 text-blue-400 mr-2" />
                <p className="text-blue-300 font-semibold">AI is speaking:</p>
              </div>
              <p className="text-white text-lg">"{currentResponse}"</p>
            </div>
          )}

          {/* Messages */}
          {messages.length > 0 && (
            <div className="glass-dark rounded-2xl p-6 max-h-80 overflow-y-auto space-y-4 mb-8">
              <h4 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-yellow-400" />
                Conversation History
              </h4>
              {messages.slice(-6).map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl p-4 ${
                      msg.role === "user" ? "gradient-gold-bg text-black" : "glass-dark border border-gray-600"
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center mt-1">
                        {msg.role === "assistant" ? (
                          <Bot className="w-4 h-4 text-gray-400" />
                        ) : (
                          <User className="w-4 h-4 text-black" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={msg.role === "user" ? "text-black" : "text-white"}>{msg.content}</p>
                        {msg.audioUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => playClonedVoiceAudio(msg.audioUrl!)}
                            className="mt-3 p-2 h-auto text-sm hover:bg-white/10"
                          >
                            <Volume2 className="w-4 h-4 mr-2" />
                            Replay Voice
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
                className="w-full gradient-gold-bg hover:shadow-2xl hover:shadow-yellow-500/25 text-black py-6 text-xl font-semibold rounded-2xl"
              >
                <Phone className="w-6 h-6 mr-3" />
                Start Conversation
              </Button>
            )}

            {isActive && (
              <Button
                onClick={stopChat}
                size="lg"
                className="w-full bg-red-600 hover:bg-red-700 text-white py-6 text-xl font-semibold rounded-2xl"
              >
                <PhoneOff className="w-6 h-6 mr-3" />
                End Conversation
              </Button>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="glass-dark rounded-2xl p-6">
              <Mic className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
              <p className="font-semibold text-white mb-2">Speak Naturally</p>
              <p className="text-gray-400 text-sm">Talk as you normally would in conversation</p>
            </div>
            <div className="glass-dark rounded-2xl p-6">
              <Volume2 className="w-8 h-8 text-green-400 mx-auto mb-3" />
              <p className="font-semibold text-white mb-2">Hear Cloned Voice</p>
              <p className="text-gray-400 text-sm">AI responds with the uploaded voice</p>
            </div>
            <div className="glass-dark rounded-2xl p-6">
              <Sparkles className="w-8 h-8 text-blue-400 mx-auto mb-3" />
              <p className="font-semibold text-white mb-2">Real-time AI</p>
              <p className="text-gray-400 text-sm">Instant intelligent conversations</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
