"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Volume2, Settings, Play } from "lucide-react"

interface EnhancedVoiceSynthesisProps {
  voiceProfile: {
    audioBuffer: AudioBuffer
    features: any
    sampleUrl: string
  }
  text: string
  onAudioGenerated: (audioUrl: string) => void
}

export default function EnhancedVoiceSynthesis({ voiceProfile, text, onAudioGenerated }: EnhancedVoiceSynthesisProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedAudio, setGeneratedAudio] = useState<string>("")
  const [isPlaying, setIsPlaying] = useState(false)
  const [voiceSettings, setVoiceSettings] = useState({
    pitch: 1.0,
    rate: 1.0,
    volume: 1.0,
    breathiness: 0.0,
    roughness: 0.0,
  })
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null)
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])

  const audioRef = useRef<HTMLAudioElement>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)

  useEffect(() => {
    synthRef.current = window.speechSynthesis

    const loadVoices = () => {
      const voices = synthRef.current?.getVoices() || []
      setAvailableVoices(voices)

      // Auto-select best matching voice
      const bestVoice = findBestVoiceMatch(voices, voiceProfile.features)
      setSelectedVoice(bestVoice)

      // Auto-configure settings based on voice profile
      configureVoiceSettings(voiceProfile.features)
    }

    // Load voices
    if (synthRef.current) {
      loadVoices()
      synthRef.current.onvoiceschanged = loadVoices
    }
  }, [voiceProfile])

  const findBestVoiceMatch = (voices: SpeechSynthesisVoice[], features: any): SpeechSynthesisVoice | null => {
    if (voices.length === 0) return null

    const targetPitch = features.pitchFormant?.pitch?.mean || 150
    const quality = features.metadata?.quality || 0.5
    const uniqueness = features.speaker?.uniqueness || 0.5

    console.log("🎵 Finding best voice match for:", { targetPitch, quality, uniqueness })

    let bestVoice = null
    let bestScore = -1

    for (const voice of voices) {
      let score = 0
      const voiceName = voice.name.toLowerCase()

      // Gender and pitch matching
      if (targetPitch < 130) {
        // Lower pitch - prefer male voices
        if (voiceName.includes("male") && !voiceName.includes("female")) score += 4
        if (voiceName.includes("deep") || voiceName.includes("bass")) score += 2
      } else if (targetPitch < 160) {
        // Medium-low pitch
        if (voiceName.includes("male") && !voiceName.includes("female")) score += 3
      } else if (targetPitch < 200) {
        // Medium pitch - neutral
        score += 2
      } else if (targetPitch < 250) {
        // Medium-high pitch
        if (voiceName.includes("female") && !voiceName.includes("male")) score += 3
      } else {
        // Higher pitch - prefer female voices
        if (voiceName.includes("female")) score += 4
        if (voiceName.includes("soprano") || voiceName.includes("high")) score += 2
      }

      // Language preference (English variants)
      if (voice.lang.startsWith("en-US")) score += 3
      else if (voice.lang.startsWith("en-GB")) score += 2
      else if (voice.lang.startsWith("en")) score += 1

      // Quality indicators
      if (voiceName.includes("neural") || voiceName.includes("enhanced")) score += 3
      if (voiceName.includes("premium") || voiceName.includes("pro")) score += 2
      if (voiceName.includes("google") || voiceName.includes("microsoft")) score += 2
      if (voiceName.includes("natural") || voiceName.includes("human")) score += 1

      // Voice characteristics
      if (features.quality?.breathiness > 0.3 && voiceName.includes("soft")) score += 1
      if (features.quality?.roughness > 0.3 && voiceName.includes("rough")) score += 1
      if (features.prosodic?.speakingRate > 5 && voiceName.includes("fast")) score += 1

      // Avoid robotic or synthetic sounding voices
      if (voiceName.includes("robot") || voiceName.includes("synthetic")) score -= 2

      console.log(`🎵 Voice: ${voice.name} (${voice.lang}) - Score: ${score}`)

      if (score > bestScore) {
        bestScore = score
        bestVoice = voice
      }
    }

    console.log("🎵 Selected best voice:", bestVoice?.name, "with score:", bestScore)
    return bestVoice
  }

  const configureVoiceSettings = (features: any) => {
    const pitchMean = features.pitchFormant?.pitch?.mean || 150
    const speakingRate = features.prosodic?.speakingRate || 4
    const breathiness = features.quality?.breathiness || 0
    const roughness = features.quality?.roughness || 0

    // Calculate optimal settings
    const pitchSetting = Math.max(0.1, Math.min(2.0, pitchMean / 150))
    const rateSetting = Math.max(0.3, Math.min(1.8, speakingRate / 4))

    setVoiceSettings({
      pitch: pitchSetting,
      rate: rateSetting,
      volume: 1.0,
      breathiness: Math.min(0.5, breathiness),
      roughness: Math.min(0.5, roughness),
    })

    console.log("🎵 Auto-configured voice settings:", {
      pitch: pitchSetting,
      rate: rateSetting,
      breathiness,
      roughness,
    })
  }

  const generateEnhancedSpeech = async () => {
    if (!synthRef.current || !text) return

    setIsGenerating(true)

    try {
      // Method 1: Try advanced browser synthesis with multiple voices
      const audioUrl = await synthesizeWithEnhancements()
      if (audioUrl) {
        setGeneratedAudio(audioUrl)
        onAudioGenerated(audioUrl)
      }
    } catch (error) {
      console.error("Enhanced synthesis failed:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const synthesizeWithEnhancements = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!synthRef.current) {
        reject(new Error("Speech synthesis not available"))
        return
      }

      // Cancel any existing speech
      synthRef.current.cancel()

      const utterance = new SpeechSynthesisUtterance(text)

      // Apply selected voice
      if (selectedVoice) {
        utterance.voice = selectedVoice
      }

      // Apply voice settings with enhancements
      utterance.pitch = voiceSettings.pitch
      utterance.rate = voiceSettings.rate
      utterance.volume = voiceSettings.volume

      // Add subtle variations for more natural speech
      const pitchVariation = 0.05 * Math.sin(Date.now() / 1000)
      const rateVariation = 0.02 * Math.sin(Date.now() / 1500)

      utterance.pitch = Math.max(0.1, Math.min(2.0, utterance.pitch + pitchVariation))
      utterance.rate = Math.max(0.3, Math.min(1.8, utterance.rate + rateVariation))

      console.log("🗣️ Enhanced synthesis settings:", {
        voice: utterance.voice?.name,
        pitch: utterance.pitch,
        rate: utterance.rate,
        volume: utterance.volume,
      })

      utterance.onstart = () => {
        console.log("🗣️ Enhanced speech started")
      }

      utterance.onend = () => {
        console.log("✅ Enhanced speech completed")
        // For now, return a placeholder URL since we can't capture browser TTS audio directly
        resolve("enhanced-speech-generated")
      }

      utterance.onerror = (error) => {
        console.error("❌ Enhanced synthesis error:", error)
        reject(error)
      }

      // Speak with enhancements
      synthRef.current.speak(utterance)
    })
  }

  const playGeneratedAudio = () => {
    if (generatedAudio && synthRef.current) {
      // Re-synthesize and play
      generateEnhancedSpeech()
    }
  }

  const getVoiceTypeLabel = (voice: SpeechSynthesisVoice): string => {
    const name = voice.name.toLowerCase()
    if (name.includes("neural") || name.includes("enhanced")) return "Neural"
    if (name.includes("premium") || name.includes("pro")) return "Premium"
    if (name.includes("natural")) return "Natural"
    return "Standard"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Volume2 className="w-5 h-5" />
          <span>Enhanced Voice Synthesis</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Voice Selection */}
        <div className="space-y-3">
          <h4 className="font-medium">Selected Voice</h4>
          {selectedVoice ? (
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{selectedVoice.name}</p>
                  <p className="text-sm text-gray-600">{selectedVoice.lang}</p>
                </div>
                <Badge variant="secondary">{getVoiceTypeLabel(selectedVoice)}</Badge>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Loading voices...</p>
          )}
        </div>

        {/* Voice Settings */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Voice Characteristics</span>
          </h4>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Pitch: {voiceSettings.pitch.toFixed(2)}</label>
              <Slider
                value={[voiceSettings.pitch]}
                onValueChange={([value]) => setVoiceSettings({ ...voiceSettings, pitch: value })}
                min={0.1}
                max={2.0}
                step={0.05}
                className="mt-2"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Speaking Rate: {voiceSettings.rate.toFixed(2)}</label>
              <Slider
                value={[voiceSettings.rate]}
                onValueChange={([value]) => setVoiceSettings({ ...voiceSettings, rate: value })}
                min={0.3}
                max={1.8}
                step={0.05}
                className="mt-2"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Volume: {voiceSettings.volume.toFixed(2)}</label>
              <Slider
                value={[voiceSettings.volume]}
                onValueChange={([value]) => setVoiceSettings({ ...voiceSettings, volume: value })}
                min={0.1}
                max={1.0}
                step={0.05}
                className="mt-2"
              />
            </div>
          </div>
        </div>

        {/* Voice Profile Match */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium mb-2">Voice Profile Matching</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Target Pitch:</span>{" "}
              {voiceProfile.features.pitchFormant?.pitch?.mean?.toFixed(0) || "N/A"}Hz
            </div>
            <div>
              <span className="text-gray-500">Speaking Rate:</span>{" "}
              {voiceProfile.features.prosodic?.speakingRate?.toFixed(1) || "N/A"} syl/s
            </div>
            <div>
              <span className="text-gray-500">Voice Quality:</span>{" "}
              {((voiceProfile.features.quality?.clarity || 0) * 100).toFixed(0)}%
            </div>
            <div>
              <span className="text-gray-500">Uniqueness:</span>{" "}
              {((voiceProfile.features.speaker?.uniqueness || 0) * 100).toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <Button
          onClick={generateEnhancedSpeech}
          disabled={isGenerating || !text}
          className="w-full bg-green-500 hover:bg-green-600"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Volume2 className="w-4 h-4 mr-2 animate-pulse" />
              Generating Enhanced Speech...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Generate Enhanced Speech
            </>
          )}
        </Button>

        {/* Play Generated Audio */}
        {generatedAudio && (
          <Button onClick={playGeneratedAudio} variant="outline" className="w-full">
            <Play className="w-4 h-4 mr-2" />
            Play Enhanced Audio
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
