"use client"

import { useState, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  Upload,
  Mic,
  Square,
  Play,
  Pause,
  Loader2,
  CheckCircle,
  AlertTriangle,
  AudioWaveformIcon as Waveform,
  Sparkles,
} from "lucide-react"

interface ModernVoiceClonerProps {
  onVoiceCloned: (voiceId: string, audioUrl: string) => void
}

export default function ModernVoiceCloner({ onVoiceCloned }: ModernVoiceClonerProps) {
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

  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

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

      // Start timer
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
      // Step 1: Prepare audio
      setCurrentStep("Analyzing your voice sample...")
      setProgress(20)

      const formData = new FormData()
      formData.append("audio", audioFile, audioFile.name)

      // Step 2: Upload to ElevenLabs
      setCurrentStep("Creating neural voice model...")
      setProgress(50)

      console.log("🎤 Sending to ElevenLabs for voice cloning...")

      const response = await fetch("/api/clone-voice", {
        method: "POST",
        body: formData,
      })

      console.log("📡 Voice cloning response:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const result = await response.json()
      console.log("✅ Voice cloning result:", result)

      // Step 3: Complete
      setCurrentStep("Voice clone ready!")
      setProgress(100)

      setSuccess(`🎉 Voice successfully cloned! Your AI twin is ready.`)

      setTimeout(() => {
        onVoiceCloned(result.voiceId, audioUrl)
      }, 2000)
    } catch (error) {
      console.error("❌ Voice cloning error:", error)
      setError(error instanceof Error ? error.message : "Voice cloning failed")
      setIsCloning(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="font-display text-4xl font-bold text-white mb-4">Clone Your Voice</h2>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Upload an audio file or record yourself speaking for 30+ seconds to create your AI voice clone
        </p>
      </div>

      <Card className="glass-effect border-white/20 shadow-2xl">
        <CardContent className="p-8">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center space-x-3 mb-6">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center space-x-3 mb-6">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <p className="text-green-300 text-sm">{success}</p>
            </div>
          )}

          {!isCloning && !success && (
            <div className="space-y-8">
              {/* Upload Section */}
              <div
                className="border-2 border-dashed border-purple-500/30 rounded-2xl p-12 text-center cursor-pointer hover:border-purple-500/50 transition-all duration-300 group bg-gradient-to-br from-purple-500/5 to-blue-500/5"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Upload className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-white mb-2">Upload Audio File</h3>
                <p className="text-gray-400 mb-4">MP3, WAV, M4A - speak for 30+ seconds for best results</p>
                <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                  Drag & Drop or Click to Browse
                </Badge>
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
                  <div className="w-full border-t border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-gray-900 text-gray-400 font-medium">OR</span>
                </div>
              </div>

              {/* Recording Section */}
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <div
                    className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 ${
                      isRecording
                        ? "bg-gradient-to-br from-red-500 to-pink-500 animate-pulse scale-110 shadow-2xl shadow-red-500/50"
                        : "bg-gradient-to-br from-purple-500 to-blue-500 hover:scale-105 shadow-xl shadow-purple-500/30"
                    }`}
                  >
                    {isRecording ? (
                      <div className="text-center">
                        <Square className="w-8 h-8 text-white mb-1" />
                        <div className="text-white text-xs font-mono">{formatTime(recordingTime)}</div>
                      </div>
                    ) : (
                      <Mic className="w-12 h-12 text-white" />
                    )}
                  </div>
                </div>

                {isRecording && (
                  <div className="flex justify-center space-x-2">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1 bg-gradient-to-t from-red-500 to-pink-500 rounded-full animate-pulse"
                        style={{
                          height: `${Math.random() * 40 + 20}px`,
                          animationDelay: `${i * 0.1}s`,
                        }}
                      />
                    ))}
                  </div>
                )}

                {!isRecording ? (
                  <Button
                    onClick={startRecording}
                    size="lg"
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-xl hover:shadow-purple-500/25 transition-all duration-300"
                  >
                    <Mic className="w-5 h-5 mr-2" />
                    Start Recording
                  </Button>
                ) : (
                  <Button
                    onClick={stopRecording}
                    size="lg"
                    className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-xl hover:shadow-red-500/25 transition-all duration-300"
                  >
                    <Square className="w-5 h-5 mr-2" />
                    Stop Recording
                  </Button>
                )}

                <p className="text-gray-400 max-w-md mx-auto">
                  Record yourself speaking naturally for 30-60 seconds. Read a paragraph or talk about yourself for the
                  best voice clone quality.
                </p>
              </div>

              {/* Audio Preview & Clone */}
              {audioUrl && (
                <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-6 border border-gray-700/50">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                      <Waveform className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-white">{audioFile?.name || "Recorded Audio"}</h4>
                      <p className="text-gray-400 text-sm">Ready for voice cloning</p>
                    </div>
                  </div>

                  <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} className="hidden" />

                  <div className="flex space-x-3">
                    <Button
                      onClick={togglePlayback}
                      variant="outline"
                      className="flex-1 glass-effect border-white/20 text-white hover:bg-white/10"
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="w-4 h-4 mr-2" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Play Preview
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={cloneVoice}
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-xl hover:shadow-green-500/25 transition-all duration-300"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Clone My Voice
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Cloning Progress */}
          {isCloning && (
            <div className="text-center space-y-6">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-white animate-spin" />
              </div>

              <div className="space-y-4">
                <h3 className="text-2xl font-semibold text-white">{currentStep}</h3>
                <div className="max-w-md mx-auto">
                  <Progress value={progress} className="h-3 bg-gray-700" />
                  <p className="text-gray-400 text-sm mt-2">{progress}% Complete</p>
                </div>
              </div>

              <p className="text-gray-400 max-w-md mx-auto">
                Creating your neural voice model with ElevenLabs technology...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
