"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Upload, Mic, Square, Play, Pause, Loader2, AlertCircle } from "lucide-react"

interface VoiceClonerProps {
  onVoiceCloned: (voiceId: string, audioUrl: string, features: any) => void
}

export default function VoiceCloner({ onVoiceCloned }: VoiceClonerProps) {
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string>("")
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState("")
  const [error, setError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const handleFileUpload = (file: File) => {
    if (file && file.type.startsWith("audio/")) {
      const url = URL.createObjectURL(file)
      setAudioFile(file)
      setRecordedBlob(null)
      setAudioUrl(url)
      setError(null)
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
        setRecordedBlob(blob)
        setAudioFile(null)
        setAudioUrl(url)
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorderRef.current.start(100)
      setIsRecording(true)
      setError(null)
    } catch (error) {
      setError("Could not access microphone. Please check permissions.")
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

  const processVoiceClone = async () => {
    if (!audioUrl) return

    setIsProcessing(true)
    setProgress(0)
    setError(null)

    try {
      const audioBlob = recordedBlob || audioFile
      if (!audioBlob) throw new Error("No audio available")

      // Try the full voice cloning process first
      try {
        // Step 1: Upload and analyze audio
        setCurrentStep("Analyzing voice characteristics...")
        setProgress(20)

        const formData = new FormData()
        formData.append("audio", audioBlob, "voice-sample.wav")

        const analyzeResponse = await fetch("/api/analyze-voice", {
          method: "POST",
          body: formData,
        })

        if (!analyzeResponse.ok) {
          throw new Error("Analysis failed, trying simple approach...")
        }

        const analysisResult = await analyzeResponse.json()

        // Step 2: Convert audio to array for processing
        setCurrentStep("Processing audio data...")
        setProgress(40)

        const audioArrayBuffer = await audioBlob.arrayBuffer()
        const audioDataArray = Array.from(new Uint8Array(audioArrayBuffer))

        // Step 3: Create voice model
        setCurrentStep("Creating voice model...")
        setProgress(60)

        const cloneResponse = await fetch("/api/create-voice-model", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            audioData: audioDataArray,
            analysis: analysisResult.analysis,
          }),
        })

        if (!cloneResponse.ok) {
          throw new Error("Voice model creation failed, trying simple approach...")
        }

        const voiceModel = await cloneResponse.json()

        // Step 4: Complete
        setCurrentStep("Voice clone ready!")
        setProgress(100)

        setTimeout(() => {
          onVoiceCloned(voiceModel.voiceId, audioUrl, voiceModel.features)
        }, 1000)
      } catch (fullProcessError) {
        console.log("Full process failed, trying simple approach:", fullProcessError)

        // Fallback to simple voice cloning
        setCurrentStep("Using simplified voice cloning...")
        setProgress(70)

        const formData = new FormData()
        formData.append("audio", audioBlob, "voice-sample.wav")

        const simpleResponse = await fetch("/api/simple-voice-clone", {
          method: "POST",
          body: formData,
        })

        if (!simpleResponse.ok) {
          throw new Error("Both advanced and simple voice cloning failed")
        }

        const simpleResult = await simpleResponse.json()

        setCurrentStep("Simple voice clone ready!")
        setProgress(100)

        setTimeout(() => {
          onVoiceCloned(simpleResult.voiceId, audioUrl, simpleResult.features)
        }, 1000)
      }
    } catch (error) {
      console.error("Voice cloning error:", error)
      setError(error instanceof Error ? error.message : "Voice cloning failed")
      setIsProcessing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 1: Provide Your Voice Sample</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {!isProcessing && (
          <>
            {/* Upload Section */}
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">Upload Audio File</p>
              <p className="text-sm text-gray-500">MP3, WAV, M4A - at least 10 seconds recommended</p>
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
              <p className="text-sm text-gray-500">Speak for at least 10-15 seconds for best results</p>
            </div>

            {/* Audio Preview & Process */}
            {audioUrl && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="font-medium mb-2">{audioFile ? `📁 ${audioFile.name}` : "🎤 Recorded Audio"}</p>
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
                    <Button onClick={processVoiceClone} className="flex-1 bg-green-500 hover:bg-green-600">
                      Clone This Voice
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Processing */}
        {isProcessing && (
          <div className="space-y-4 text-center">
            <div className="flex justify-center">
              <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
            </div>
            <div>
              <p className="text-lg font-medium mb-2">{currentStep}</p>
              <Progress value={progress} className="w-full" />
            </div>
            <p className="text-sm text-gray-500">This process may take 1-2 minutes...</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
