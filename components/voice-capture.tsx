"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Upload, Mic, Square, Play, Pause, Loader2, Volume2 } from "lucide-react"

interface VoiceCaptureProps {
  onVoiceCaptured: (audioBuffer: AudioBuffer, features: any, sampleUrl: string) => void
}

export default function VoiceCapture({ onVoiceCaptured }: VoiceCaptureProps) {
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState("")
  const [audioUrl, setAudioUrl] = useState<string>("")
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    // Initialize audio context
    const initAudioContext = () => {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      setAudioContext(ctx)
    }

    initAudioContext()

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  const handleFileUpload = async (file: File) => {
    if (file && file.type.startsWith("audio/")) {
      const url = URL.createObjectURL(file)
      setAudioFile(file)
      setAudioUrl(url)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false, // Keep natural voice characteristics
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 44100,
          channelCount: 1,
        },
      })

      streamRef.current = stream
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
        audioBitsPerSecond: 128000,
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
    } catch (error) {
      alert("Could not access microphone. Please check permissions.")
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

  const processVoice = async () => {
    if (!audioFile || !audioContext) return

    setIsProcessing(true)
    setProgress(0)

    try {
      // Step 1: Load audio into AudioBuffer
      setCurrentStep("Loading audio data...")
      setProgress(20)

      const arrayBuffer = await audioFile.arrayBuffer()
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

      // Step 2: Analyze voice characteristics
      setCurrentStep("Analyzing voice characteristics...")
      setProgress(40)

      const features = await analyzeVoiceFeatures(audioBuffer)

      // Step 3: Create voice profile
      setCurrentStep("Creating voice profile...")
      setProgress(70)

      // Step 4: Complete
      setCurrentStep("Voice profile ready!")
      setProgress(100)

      setTimeout(() => {
        onVoiceCaptured(audioBuffer, features, audioUrl)
      }, 1000)
    } catch (error) {
      console.error("Voice processing error:", error)
      alert("Voice processing failed. Please try again.")
      setIsProcessing(false)
    }
  }

  const analyzeVoiceFeatures = async (audioBuffer: AudioBuffer): Promise<any> => {
    const channelData = audioBuffer.getChannelData(0)
    const sampleRate = audioBuffer.sampleRate

    // Analyze fundamental frequency (pitch)
    const pitch = analyzePitch(channelData, sampleRate)

    // Analyze spectral characteristics
    const spectral = analyzeSpectralFeatures(channelData, sampleRate)

    // Analyze temporal features
    const temporal = analyzeTemporal(channelData, sampleRate)

    return {
      pitch,
      spectral,
      temporal,
      sampleRate,
      duration: audioBuffer.duration,
    }
  }

  const analyzePitch = (data: Float32Array, sampleRate: number): any => {
    // Simple autocorrelation-based pitch detection
    const windowSize = Math.floor(sampleRate * 0.05) // 50ms window
    let maxCorrelation = 0
    let bestPeriod = 0

    for (let period = Math.floor(sampleRate / 500); period < Math.floor(sampleRate / 50); period++) {
      let correlation = 0
      for (let i = 0; i < windowSize; i++) {
        if (i + period < data.length) {
          correlation += data[i] * data[i + period]
        }
      }
      if (correlation > maxCorrelation) {
        maxCorrelation = correlation
        bestPeriod = period
      }
    }

    const fundamentalFreq = bestPeriod > 0 ? sampleRate / bestPeriod : 150

    return {
      fundamental: fundamentalFreq,
      confidence: maxCorrelation,
    }
  }

  const analyzeSpectralFeatures = (data: Float32Array, sampleRate: number): any => {
    // Simple spectral analysis
    const fftSize = 2048
    const fft = new Float32Array(fftSize)
    data.slice(0, fftSize).forEach((val, i) => (fft[i] = val))

    // Calculate spectral centroid (brightness)
    let weightedSum = 0
    let magnitudeSum = 0

    for (let i = 1; i < fftSize / 2; i++) {
      const magnitude = Math.abs(fft[i])
      const frequency = (i * sampleRate) / fftSize
      weightedSum += frequency * magnitude
      magnitudeSum += magnitude
    }

    const spectralCentroid = magnitudeSum > 0 ? weightedSum / magnitudeSum : 1000

    return {
      centroid: spectralCentroid,
      brightness: Math.min(1, spectralCentroid / 2000),
    }
  }

  const analyzeTemporal = (data: Float32Array, sampleRate: number): any => {
    // Analyze speaking rate and rhythm
    const frameSize = Math.floor(sampleRate * 0.01) // 10ms frames
    const frames = []

    for (let i = 0; i < data.length - frameSize; i += frameSize) {
      let energy = 0
      for (let j = 0; j < frameSize; j++) {
        energy += data[i + j] * data[i + j]
      }
      frames.push(energy / frameSize)
    }

    // Find speech segments
    const threshold = Math.max(...frames) * 0.1
    const speechFrames = frames.filter((frame) => frame > threshold)

    return {
      speechRatio: speechFrames.length / frames.length,
      averageEnergy: speechFrames.reduce((a, b) => a + b, 0) / speechFrames.length || 0,
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 1: Capture Your Voice</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isProcessing && (
          <>
            {/* Upload Section */}
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">Upload Audio File</p>
              <p className="text-sm text-gray-500">MP3, WAV, M4A - speak for 10-30 seconds</p>
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
                  className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                    isRecording ? "bg-red-100 animate-pulse" : "bg-blue-100"
                  }`}
                >
                  <Mic className={`w-12 h-12 ${isRecording ? "text-red-500" : "text-blue-500"}`} />
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
                Speak naturally for 15-30 seconds. Say something like: "Hello, this is my voice. I'm testing the voice
                cloning system."
              </p>
            </div>

            {/* Audio Preview & Process */}
            {audioUrl && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Volume2 className="w-5 h-5 text-green-500" />
                    <p className="font-medium">{audioFile?.name || "Recorded Audio"}</p>
                  </div>
                  <audio
                    ref={audioRef}
                    src={audioUrl}
                    onEnded={() => setIsPlaying(false)}
                    controls
                    className="w-full mb-3"
                  />
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
                    <Button onClick={processVoice} className="flex-1 bg-green-500 hover:bg-green-600">
                      Create Voice Profile
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
            <p className="text-sm text-gray-500">Analyzing your voice characteristics...</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
