"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Mic, MicOff, Phone, Volume2 } from "lucide-react"

interface RealTimeVoiceChatProps {
  voiceProfile: {
    audioBuffer: AudioBuffer
    features: any
    sampleUrl: string
  }
}

export default function RealTimeVoiceChat({ voiceProfile }: RealTimeVoiceChatProps) {
  const [isActive, setIsActive] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [currentConversation, setCurrentConversation] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [currentResponse, setCurrentResponse] = useState<string>("")
  const [showVoiceSettings, setShowVoiceSettings] = useState(false)

  const recognitionRef = useRef<any>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const isProcessingRef = useRef(false)
  const selectedVoiceRef = useRef<SpeechSynthesisVoice | null>(null)
  const voiceSettingsRef = useRef({
    pitch: 1.0,
    rate: 1.0,
    volume: 1.0,
  })

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
            setCurrentConversation((prev) => [...prev, `You: ${transcript}`])

            try {
              // Get AI response from Claude
              console.log("🤖 Getting Claude response...")
              const aiResponse = await getClaudeResponse(transcript)
              console.log("💬 Claude response:", aiResponse)

              setCurrentResponse(aiResponse)
              setCurrentConversation((prev) => [...prev, `AI: ${aiResponse}`])

              // Speak the response with enhanced synthesis
              console.log("🗣️ Speaking enhanced response...")
              await speakEnhancedResponse(aiResponse)
              console.log("✅ Enhanced speech completed")
            } catch (error) {
              console.error("❌ Error in conversation:", error)
              setError("Failed to get AI response")
              await speakEnhancedResponse("I'm sorry, I had trouble processing that. Could you try again?")
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

      // Initialize speech synthesis
      synthRef.current = window.speechSynthesis

      // Configure voice settings based on profile
      configureEnhancedVoice()
    }

    initSpeechRecognition()

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (synthRef.current) {
        synthRef.current.cancel()
      }
    }
  }, [isActive, isSpeaking])

  const configureEnhancedVoice = () => {
    if (!synthRef.current) return

    const loadVoices = () => {
      const voices = synthRef.current!.getVoices()
      if (voices.length > 0) {
        const bestVoice = findAdvancedVoiceMatch(voices, voiceProfile.features)
        selectedVoiceRef.current = bestVoice

        // Configure settings based on voice profile
        const pitchMean = voiceProfile.features.pitchFormant?.pitch?.mean || 150
        const speakingRate = voiceProfile.features.prosodic?.speakingRate || 4

        voiceSettingsRef.current = {
          pitch: Math.max(0.1, Math.min(2.0, pitchMean / 150)),
          rate: Math.max(0.3, Math.min(1.8, speakingRate / 4)),
          volume: 1.0,
        }

        console.log("🎵 Enhanced voice configured:", {
          voice: bestVoice?.name,
          settings: voiceSettingsRef.current,
        })
      }
    }

    if (synthRef.current.getVoices().length === 0) {
      synthRef.current.onvoiceschanged = loadVoices
    } else {
      loadVoices()
    }
  }

  const findAdvancedVoiceMatch = (voices: SpeechSynthesisVoice[], features: any): SpeechSynthesisVoice | null => {
    const targetPitch = features.pitchFormant?.pitch?.mean || 150
    const quality = features.metadata?.quality || 0.5
    const uniqueness = features.speaker?.uniqueness || 0.5

    console.log("🎵 Advanced voice matching for:", { targetPitch, quality, uniqueness })

    let bestVoice = null
    let bestScore = -1

    for (const voice of voices) {
      let score = 0
      const voiceName = voice.name.toLowerCase()

      // Enhanced gender and pitch matching
      if (targetPitch < 120) {
        if (voiceName.includes("male") && !voiceName.includes("female")) score += 5
        if (voiceName.includes("deep") || voiceName.includes("bass") || voiceName.includes("low")) score += 3
      } else if (targetPitch < 140) {
        if (voiceName.includes("male") && !voiceName.includes("female")) score += 4
      } else if (targetPitch < 180) {
        score += 2 // Neutral range
      } else if (targetPitch < 220) {
        if (voiceName.includes("female") && !voiceName.includes("male")) score += 4
      } else {
        if (voiceName.includes("female")) score += 5
        if (voiceName.includes("high") || voiceName.includes("soprano")) score += 3
      }

      // Premium voice quality indicators
      if (voiceName.includes("neural") || voiceName.includes("wavenet")) score += 4
      if (voiceName.includes("enhanced") || voiceName.includes("premium")) score += 3
      if (voiceName.includes("natural") || voiceName.includes("human")) score += 2
      if (voiceName.includes("studio") || voiceName.includes("pro")) score += 2

      // Language and accent preferences
      if (voice.lang === "en-US") score += 4
      else if (voice.lang === "en-GB") score += 3
      else if (voice.lang.startsWith("en")) score += 2

      // Voice characteristics matching
      if (features.quality?.breathiness > 0.3) {
        if (voiceName.includes("soft") || voiceName.includes("breathy")) score += 2
      }
      if (features.quality?.roughness > 0.3) {
        if (voiceName.includes("rough") || voiceName.includes("raspy")) score += 2
      }
      if (features.prosodic?.speakingRate > 5) {
        if (voiceName.includes("fast") || voiceName.includes("quick")) score += 1
      }

      // Avoid poor quality voices
      if (voiceName.includes("robot") || voiceName.includes("synthetic")) score -= 3
      if (voiceName.includes("monotone") || voiceName.includes("flat")) score -= 2

      if (score > bestScore) {
        bestScore = score
        bestVoice = voice
      }
    }

    console.log("🎵 Best advanced voice match:", bestVoice?.name, "Score:", bestScore)
    return bestVoice
  }

  const startChat = () => {
    if (recognitionRef.current) {
      setIsActive(true)
      setCurrentConversation([])
      setError(null)
      isProcessingRef.current = false
      console.log("🚀 Starting enhanced voice chat with Claude...")

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
    console.log("🛑 Stopping enhanced voice chat...")
    setIsActive(false)
    isProcessingRef.current = false

    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    if (synthRef.current) {
      synthRef.current.cancel()
    }

    setIsListening(false)
    setIsSpeaking(false)
    setError(null)
  }

  const getClaudeResponse = async (userInput: string): Promise<string> => {
    try {
      console.log("📡 Sending to Claude API:", userInput)

      const response = await fetch("/api/chat-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userInput }),
      })

      console.log("📡 API response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("📡 API response data:", data)
        return data.response || "I heard you, but I'm not sure how to respond to that."
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

  const speakEnhancedResponse = async (text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!synthRef.current) {
        console.error("❌ Speech synthesis not available")
        resolve()
        return
      }

      setIsSpeaking(true)

      // Cancel any existing speech
      synthRef.current.cancel()

      const utterance = new SpeechSynthesisUtterance(text)

      // Apply enhanced voice settings
      if (selectedVoiceRef.current) {
        utterance.voice = selectedVoiceRef.current
      }

      utterance.pitch = voiceSettingsRef.current.pitch
      utterance.rate = voiceSettingsRef.current.rate
      utterance.volume = voiceSettingsRef.current.volume

      // Add natural variations
      const pitchVariation = 0.03 * Math.sin(Date.now() / 1000)
      const rateVariation = 0.02 * Math.sin(Date.now() / 1500)

      utterance.pitch = Math.max(0.1, Math.min(2.0, utterance.pitch + pitchVariation))
      utterance.rate = Math.max(0.3, Math.min(1.8, utterance.rate + rateVariation))

      console.log("🗣️ Enhanced synthesis with:", {
        voice: utterance.voice?.name,
        pitch: utterance.pitch,
        rate: utterance.rate,
        volume: utterance.volume,
      })

      utterance.onstart = () => {
        console.log("🗣️ Enhanced speech started")
      }

      utterance.onend = () => {
        console.log("✅ Enhanced speech ended")
        setIsSpeaking(false)
        resolve()
      }

      utterance.onerror = (error) => {
        console.error("❌ Enhanced synthesis error:", error)
        setIsSpeaking(false)
        resolve()
      }

      // Speak with enhanced settings
      synthRef.current.speak(utterance)
    })
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Enhanced AI Voice Chat</CardTitle>
        <p className="text-gray-600">Advanced voice matching with Claude AI</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enhanced Voice Profile Info */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Volume2 className="w-5 h-5 text-blue-500" />
              <span className="font-medium">Enhanced Voice Profile</span>
            </div>
            <div className="flex space-x-2">
              <Badge variant="secondary">
                Pitch: {voiceProfile.features.pitchFormant?.pitch?.mean?.toFixed(0) || "N/A"}Hz
              </Badge>
              <Badge variant="secondary">
                Quality: {((voiceProfile.features.metadata?.quality || 0) * 100).toFixed(0)}%
              </Badge>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Clarity:</span>{" "}
              {((voiceProfile.features.quality?.clarity || 0) * 100).toFixed(0)}%
            </div>
            <div>
              <span className="text-gray-500">Uniqueness:</span>{" "}
              {((voiceProfile.features.speaker?.uniqueness || 0) * 100).toFixed(0)}%
            </div>
            <div>
              <span className="text-gray-500">Speaking Rate:</span>{" "}
              {voiceProfile.features.prosodic?.speakingRate?.toFixed(1) || "N/A"} syl/s
            </div>
          </div>
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
              {isSpeaking ? "🗣️ AI Speaking (Enhanced)" : isListening ? "👂 Listening..." : isActive ? "Ready" : "Inactive"}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {isActive
                ? "Enhanced voice synthesis with advanced matching"
                : "Start chat for enhanced voice conversation"}
            </p>
          </div>
        </div>

        {/* Current Response Display */}
        {currentResponse && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm font-medium text-green-800 mb-1">🤖 Claude is saying:</p>
            <p className="text-sm text-green-700">"{currentResponse}"</p>
          </div>
        )}

        {/* Conversation History */}
        {currentConversation.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4 max-h-40 overflow-y-auto">
            <h4 className="font-medium mb-2">Enhanced Conversation:</h4>
            {currentConversation.slice(-4).map((msg, idx) => (
              <div key={idx} className="text-sm mb-1">
                {msg}
              </div>
            ))}
          </div>
        )}

        {/* Controls */}
        <div className="space-y-3">
          {!isActive && (
            <Button onClick={startChat} className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3" size="lg">
              <Phone className="w-5 h-5 mr-2" />
              Start Enhanced Voice Chat
            </Button>
          )}

          {isActive && (
            <Button onClick={stopChat} className="w-full bg-red-500 hover:bg-re\
