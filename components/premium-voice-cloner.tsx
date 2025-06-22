"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Upload, Mic, Square, Play, Pause, Loader2, CheckCircle, AlertTriangle, Sparkles } from "lucide-react"

interface PremiumVoiceClonerProps {
  onVoiceCloned: (voiceId: string, audioUrl: string) => void
}

export default function PremiumVoiceCloner({ onVoiceCloned }: PremiumVoiceClonerProps) {
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isCloning, setIsCloning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState("")
  const [audioUrl, setAudioUrl] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const handleFileUpload = async (file: File) => {
    if (file && file.type.startsWith("audio/")) {
      const url = URL.createObjectURL(file)
      setAudioFile(file)
      setAudioUrl(url)
      setError(null)
      setSuccess(null)
    } else {
      setError("Please select a valid audio file (MP3, WAV, M4A, etc.)")
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      })

      streamRef.current = stream
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      })
      chunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" })
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        setAudioFile(new File([blob], "recorded-voice.webm", { type: "audio/webm" }))
      }

      mediaRecorderRef.current.start(100)
      setIsRecording(true)
      setRecordingTime(0)
      setError(null)
      setSuccess(null)

      intervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (error) {
      setError("Could not access microphone. Please check permissions.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        audioRef.current.play()
        setIsPlaying(true)
      }
    }
  }

  const cloneVoice = async () => {
    if (!audioFile) return

    setIsCloning(true)
    setProgress(0)
    setError(null)
    setSuccess(null)

    try {
      setCurrentStep("Analyzing vocal patterns...")
      setProgress(20)

      const formData = new FormData()
      formData.append("audio", audioFile, audioFile.name)

      setCurrentStep("Building neural voice model...")
      setProgress(50)

      const response = await fetch("/api/clone-voice", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        let errorMessage: string
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.details || `HTTP ${response.status}`
        } catch (parseError) {
          // If JSON parsing fails, try to get text
          try {
            const errorText = await response.text()
            errorMessage = errorText || `HTTP ${response.status}`
          } catch (textError) {
            errorMessage = `Network error (${response.status})`
          }
        }
        throw new Error(errorMessage)
      }

      let result: any
      try {
        result = await response.json()
      } catch (jsonError) {
        throw new Error("Server response was not valid JSON")
      }

      setCurrentStep("Calibrating voice synthesis...")
      setProgress(80)

      await new Promise((resolve) => setTimeout(resolve, 1000))

      setCurrentStep("Resona voice clone complete!")
      setProgress(100)

      setSuccess("Your voice has been successfully cloned with Resona technology!")

      setTimeout(() => {
        onVoiceCloned(result.voiceId, audioUrl)
      }, 2000)
    } catch (error) {
      console.error("Voice cloning error:", error)
      let errorMessage = "Voice cloning failed"

      if (error instanceof Error) {
        if (error.message.includes("401")) {
          errorMessage = "Invalid API key. Please check your ElevenLabs configuration."
        } else if (error.message.includes("429")) {
          errorMessage = "Rate limit exceeded. Please wait a moment and try again."
        } else if (error.message.includes("Network error")) {
          errorMessage = "Network connection failed. Please check your internet connection."
        } else {
          errorMessage = error.message
        }
      }

      setError(errorMessage)
      setIsCloning(false)
      setProgress(0)
      setCurrentStep("")
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div
        className={`text-center mb-12 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
      >
        <div className="flowing-line mb-6">
          <h2 className="text-5xl font-bold text-white mb-4">
            Clone Your <span className="gradient-gold">Voice</span>
          </h2>
        </div>
        <p className="text-gray-400 max-w-3xl mx-auto leading-relaxed text-2xl">
          Upload an audio sample or record a voice to create your personalized AI voice clone
        </p>
      </div>

      <Card
        className={`glass-dark border-yellow-500/20 shadow-2xl transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
        style={{ animationDelay: "0.2s" }}
      >
        <CardHeader>
          <CardTitle className="text-2xl text-white flex items-center justify-between">
            <span className="flex items-center">
              <Sparkles className="w-6 h-6 mr-3 text-yellow-400" />
              Voice Synthesis Lab
            </span>
            <Badge className="gradient-gold-bg text-black px-4 py-1">Neural HD</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          {error && (
            <div className="glass-dark border border-red-500/30 rounded-xl p-6 flex items-center space-x-4 mb-8">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              <p className="text-red-300">{error}</p>
            </div>
          )}

          {success && (
            <div className="glass-dark border border-green-500/30 rounded-xl p-6 flex items-center space-x-4 mb-8">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <p className="text-green-300">{success}</p>
            </div>
          )}

          {!isCloning && !success && (
            <div className="space-y-8">
              {/* Upload Section */}
              <div
                className="border-2 border-dashed border-yellow-500/30 rounded-2xl p-12 text-center cursor-pointer hover:border-yellow-400/50 transition-all duration-300 glass-dark"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-16 h-16 text-yellow-400 mx-auto mb-6" />
                <h3 className="text-2xl font-semibold text-white mb-4">Upload Audio Sample</h3>
                <p className="text-gray-400 mb-6 text-lg">
                  MP3, WAV, M4A - Speak naturally for 30+ seconds for optimal results
                </p>
                <Badge className="gradient-gold-bg text-black px-6 py-2 text-sm font-medium">Browse Files</Badge>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  className="hidden"
                />
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full h-px bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-6 bg-black text-gray-400 text-lg">OR</span>
                </div>
              </div>

              {/* Recording Section */}
              <div className="text-center space-y-8">
                <div className="flex justify-center">
                  <div
                    className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer ${
                      isRecording
                        ? "glass-dark border-4 border-red-400 glow-gold"
                        : "glass-dark border-4 border-yellow-400/50 hover:border-yellow-400 glow-gold"
                    }`}
                    onClick={isRecording ? stopRecording : startRecording}
                  >
                    {isRecording ? (
                      <div className="text-center">
                        <Square className="w-8 h-8 text-red-400 mb-2 mx-auto" />
                        <div className="text-red-400 text-sm font-mono">{formatTime(recordingTime)}</div>
                      </div>
                    ) : (
                      <Mic className="w-12 h-12 text-yellow-400" />
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-semibold text-white mb-4">
                    {isRecording ? "Recording Your Voice..." : "Record Your Voice"}
                  </h3>
                  <p className="text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed">
                    Speak naturally about yourself, read a paragraph, or have a conversation. The more natural your
                    speech, the better your clone will sound.
                  </p>
                </div>
              </div>

              {/* Audio Preview & Clone */}
              {audioUrl && (
                <div className="glass-dark rounded-2xl p-8 border border-yellow-500/20">
                  <div className="flex items-center space-x-6 mb-6">
                    <div className="w-16 h-16 gradient-gold-bg rounded-2xl flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-black" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-semibold text-white mb-2">{audioFile?.name || "Voice Recording"}</h4>
                      <p className="text-gray-400">Ready for neural voice synthesis</p>
                    </div>
                  </div>

                  <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} className="hidden" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      onClick={togglePlayback}
                      variant="outline"
                      size="lg"
                      className="glass-dark border-yellow-500/30 text-white hover:bg-yellow-500/10 py-4"
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="w-5 h-5 mr-2" />
                          Pause Preview
                        </>
                      ) : (
                        <>
                          <Play className="w-5 h-5 mr-2" />
                          Play Preview
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={cloneVoice}
                      size="lg"
                      className="gradient-gold-bg hover:shadow-2xl hover:shadow-yellow-500/25 text-black py-4 font-semibold"
                    >
                      <Sparkles className="w-5 h-5 mr-2" />
                      Create Voice Clone
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Cloning Progress */}
          {isCloning && (
            <div className="text-center space-y-8">
              <div className="w-24 h-24 mx-auto glass-dark rounded-full flex items-center justify-center glow-gold">
                <Loader2 className="w-12 h-12 text-yellow-400 animate-spin" />
              </div>

              <div className="space-y-4">
                <h3 className="text-2xl font-semibold text-white">{currentStep}</h3>
                <div className="max-w-md mx-auto">
                  <Progress value={progress} className="h-3 bg-gray-800" />
                  <p className="text-gray-400 mt-3 text-lg">{progress}% Complete</p>
                </div>
              </div>

              <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                Resona is analyzing your vocal patterns and creating your personalized neural voice model...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
