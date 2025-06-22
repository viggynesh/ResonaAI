"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Upload, Mic, Square, Play, Pause, Loader2, CheckCircle, AlertTriangle } from "lucide-react"

interface ProfessionalVoiceClonerProps {
  onVoiceCloned: (voiceId: string, audioUrl: string) => void
}

export default function ProfessionalVoiceCloner({ onVoiceCloned }: ProfessionalVoiceClonerProps) {
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
      setCurrentStep("Preparing your voice sample...")
      setProgress(20)

      const formData = new FormData()
      formData.append("audio", audioFile, audioFile.name)

      setCurrentStep("Creating neural voice model...")
      setProgress(50)

      const response = await fetch("/api/clone-voice", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const result = await response.json()

      setCurrentStep("Voice clone ready!")
      setProgress(100)

      setSuccess("Voice successfully cloned! Your AI twin is ready.")

      setTimeout(() => {
        onVoiceCloned(result.voiceId, audioUrl)
      }, 2000)
    } catch (error) {
      console.error("Voice cloning error:", error)
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
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Clone Your Voice</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Upload an audio file or record yourself speaking for 30+ seconds to create your AI voice clone
        </p>
      </div>

      <Card className="shadow-xl border-gray-200">
        <CardHeader>
          <CardTitle className="text-xl text-gray-900">Voice Sample</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3 mb-6">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3 mb-6">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <p className="text-green-700 text-sm">{success}</p>
            </div>
          )}

          {!isCloning && !success && (
            <div className="space-y-6">
              {/* Upload Section */}
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-purple-400 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Audio File</h3>
                <p className="text-gray-600 mb-4">MP3, WAV, M4A - speak for 30+ seconds for best results</p>
                <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                  Click to Browse Files
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
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">OR</span>
                </div>
              </div>

              {/* Recording Section */}
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div
                    className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                      isRecording
                        ? "bg-red-100 border-4 border-red-300"
                        : "bg-purple-100 border-4 border-purple-300 hover:bg-purple-200"
                    }`}
                  >
                    {isRecording ? (
                      <div className="text-center">
                        <Square className="w-6 h-6 text-red-600 mb-1" />
                        <div className="text-red-600 text-xs font-mono">{formatTime(recordingTime)}</div>
                      </div>
                    ) : (
                      <Mic className="w-8 h-8 text-purple-600" />
                    )}
                  </div>
                </div>

                {!isRecording ? (
                  <Button
                    onClick={startRecording}
                    size="lg"
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3"
                  >
                    <Mic className="w-4 h-4 mr-2" />
                    Start Recording
                  </Button>
                ) : (
                  <Button
                    onClick={stopRecording}
                    size="lg"
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-3"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    Stop Recording
                  </Button>
                )}

                <p className="text-gray-600 max-w-md mx-auto text-sm">
                  Record yourself speaking naturally for 30-60 seconds. Read a paragraph or talk about yourself for the
                  best voice clone quality.
                </p>
              </div>

              {/* Audio Preview & Clone */}
              {audioUrl && (
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{audioFile?.name || "Recorded Audio"}</h4>
                      <p className="text-gray-600 text-sm">Ready for voice cloning</p>
                    </div>
                  </div>

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
                          Play Preview
                        </>
                      )}
                    </Button>
                    <Button onClick={cloneVoice} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                      <Mic className="w-4 h-4 mr-2" />
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
              <div className="w-16 h-16 mx-auto bg-purple-100 rounded-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-medium text-gray-900">{currentStep}</h3>
                <div className="max-w-md mx-auto">
                  <Progress value={progress} className="h-2" />
                  <p className="text-gray-600 text-sm mt-2">{progress}% Complete</p>
                </div>
              </div>

              <p className="text-gray-600 max-w-md mx-auto">
                Creating your neural voice model with ElevenLabs technology...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
