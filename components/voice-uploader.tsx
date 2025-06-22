"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Upload, File, Play, Pause, Mic, Square, Loader2 } from "lucide-react"

interface VoiceUploaderProps {
  onVoiceCloned: (voiceId: string, audioUrl: string) => void
}

export default function VoiceUploader({ onVoiceCloned }: VoiceUploaderProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string>("")
  const [isPlaying, setIsPlaying] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isCloning, setIsCloning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState("")

  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith("audio/")) {
      const url = URL.createObjectURL(file)
      setUploadedFile(file)
      setRecordedBlob(null)
      setAudioUrl(url)
    } else {
      alert("Please select a valid audio file")
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      chunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" })
        const url = URL.createObjectURL(blob)
        setRecordedBlob(blob)
        setUploadedFile(null)
        setAudioUrl(url)
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
    } catch (error) {
      alert("Error accessing microphone")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
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
    if (!audioUrl) return

    setIsCloning(true)
    setProgress(0)

    try {
      // Step 1: Prepare audio
      setCurrentStep("Preparing audio file...")
      setProgress(25)

      const audioBlob = recordedBlob || uploadedFile
      if (!audioBlob) throw new Error("No audio file available")

      // Step 2: Clone voice using our API
      setCurrentStep("Cloning voice...")
      setProgress(50)

      const formData = new FormData()
      formData.append("audio", audioBlob, "voice-sample.wav")

      const response = await fetch("/api/clone-voice-alternative", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Voice cloning failed")
      }

      const result = await response.json()

      // Step 3: Finalize
      setCurrentStep("Finalizing...")
      setProgress(100)

      setTimeout(() => {
        onVoiceCloned(result.voiceId, audioUrl)
      }, 1000)
    } catch (error) {
      console.error("Voice cloning error:", error)
      alert("Voice cloning failed. Please try again.")
      setIsCloning(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload or Record Your Voice</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isCloning && (
          <>
            {/* Upload Section */}
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-700 mb-2">Upload Audio File</p>
                <p className="text-sm text-gray-500 mb-4">MP3, WAV, M4A, or other audio formats</p>
                <Button onClick={() => fileInputRef.current?.click()} variant="outline">
                  Choose File
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  className="hidden"
                />
              </div>

              <div className="text-center text-gray-500">OR</div>

              {/* Recording Section */}
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div
                    className={`w-20 h-20 rounded-full flex items-center justify-center ${
                      isRecording ? "bg-red-100 animate-pulse" : "bg-blue-100"
                    }`}
                  >
                    <Mic className={`w-10 h-10 ${isRecording ? "text-red-500" : "text-blue-500"}`} />
                  </div>
                </div>

                {!isRecording ? (
                  <Button onClick={startRecording} className="bg-blue-500 hover:bg-blue-600">
                    <Mic className="w-4 h-4 mr-2" />
                    Record Voice
                  </Button>
                ) : (
                  <Button onClick={stopRecording} className="bg-red-500 hover:bg-red-600">
                    <Square className="w-4 h-4 mr-2" />
                    Stop Recording
                  </Button>
                )}
              </div>
            </div>

            {/* Audio Preview */}
            {audioUrl && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <File className="w-8 h-8 text-blue-500" />
                  <div className="flex-1">
                    <p className="font-medium">{uploadedFile ? uploadedFile.name : "Recorded Audio"}</p>
                    <p className="text-sm text-gray-500">Ready for voice cloning</p>
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
                        Play
                      </>
                    )}
                  </Button>
                  <Button onClick={cloneVoice} className="flex-1 bg-green-500 hover:bg-green-600">
                    Clone Voice
                  </Button>
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
            <p className="text-sm text-gray-500">This may take a few moments...</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
