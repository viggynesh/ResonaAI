"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Upload, Mic, Square, Play, Pause, Loader2, CheckCircle, AlertTriangle } from "lucide-react"

interface SimpleVoiceClonerProps {
  onVoiceCloned: (voiceId: string, audioUrl: string) => void
}

export default function SimpleVoiceCloner({ onVoiceCloned }: SimpleVoiceClonerProps) {
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isCloning, setIsCloning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState("")
  const [audioUrl, setAudioUrl] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

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
      setError(null)
      setSuccess(null)
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
      setCurrentStep("Preparing your voice sample...")
      setProgress(20)

      const formData = new FormData()
      formData.append("audio", audioFile, audioFile.name)

      // Step 2: Upload to ElevenLabs
      setCurrentStep("Creating your voice clone with ElevenLabs...")
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

      setSuccess(`Voice successfully cloned! Voice ID: ${result.voiceId}`)

      setTimeout(() => {
        onVoiceCloned(result.voiceId, audioUrl)
      }, 2000)
    } catch (error) {
      console.error("❌ Voice cloning error:", error)
      setError(error instanceof Error ? error.message : "Voice cloning failed")
      setIsCloning(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 1: Clone Your Voice with ElevenLabs</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <p className="text-green-700 text-sm">{success}</p>
          </div>
        )}

        {!isCloning && !success && (
          <>
            {/* Upload Section */}
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">Upload Audio File</p>
              <p className="text-sm text-gray-500">MP3, WAV, M4A - speak for 30+ seconds for best results</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                className="hidden"
              />
            </div>

            <div className="text-center text-gray-500 font-medium">OR</div>

            {/* Recording Section */}
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                    isRecording ? "bg-red-100 animate-pulse" : "bg-blue-100"
                  }`}
                >
                  <Mic className={`w-10 h-10 ${isRecording ? "text-red-500" : "text-blue-500"}`} />
                </div>
              </div>

              {!isRecording ? (
                <Button onClick={startRecording} className="bg-blue-500 hover:bg-blue-600" size="lg">
                  <Mic className="w-4 h-4 mr-2" />
                  Record Your Voice
                </Button>
              ) : (
                <Button onClick={stopRecording} className="bg-red-500 hover:bg-red-600" size="lg">
                  <Square className="w-4 h-4 mr-2" />
                  Stop Recording
                </Button>
              )}
              <p className="text-sm text-gray-500">
                Record yourself speaking naturally for 30-60 seconds. Read a paragraph or talk about yourself.
              </p>
            </div>

            {/* Audio Preview & Clone */}
            {audioUrl && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="font-medium mb-2">{audioFile?.name || "Recorded Audio"}</p>
                  <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} className="hidden" />
                  <div className="flex space-x-3">
                    <Button onClick={togglePlayback} variant="outline" className="flex-1">
                      {isPlaying ? (
                        <>
                          <Pause className="w-4 h-4 mr-2" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Play
                        </>
                      )}
                    </Button>
                    <Button onClick={cloneVoice} className="flex-1 bg-green-500 hover:bg-green-600">
                      Clone My Voice
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Cloning Progress */}
        {isCloning && (
          <div className="space-y-4 text-center">
            <div className="flex justify-center">
              <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
            </div>
            <div>
              <p className="text-lg font-medium mb-2">{currentStep}</p>
              <Progress value={progress} className="w-full" />
            </div>
            <p className="text-sm text-gray-500">Creating your voice clone with ElevenLabs...</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
