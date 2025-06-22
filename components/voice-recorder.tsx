"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Mic, Square, Play, Pause } from "lucide-react"

interface VoiceRecorderProps {
  onVoiceRecorded: (blob: Blob, url: string) => void
}

export default function VoiceRecorder({ onVoiceRecorded }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recordedUrl, setRecordedUrl] = useState<string>("")
  const [recordingTime, setRecordingTime] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

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
        const blob = new Blob(chunksRef.current, { type: "audio/webm;codecs=opus" })
        const url = URL.createObjectURL(blob)
        setRecordedBlob(blob)
        setRecordedUrl(url)
        onVoiceRecorded(blob, url)

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorderRef.current.start(100)
      setIsRecording(true)
      setRecordingTime(0)

      intervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (error) {
      console.error("Error accessing microphone:", error)
      alert("Error accessing microphone. Please ensure you have granted permission.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div
              className={`w-32 h-32 rounded-full flex items-center justify-center ${
                isRecording ? "bg-red-100 animate-pulse" : "bg-blue-100"
              }`}
            >
              <Mic className={`w-16 h-16 ${isRecording ? "text-red-500" : "text-blue-500"}`} />
            </div>
          </div>

          {isRecording && <div className="text-2xl font-mono text-red-500">{formatTime(recordingTime)}</div>}

          <div className="space-y-4">
            {!isRecording ? (
              <Button onClick={startRecording} className="w-full bg-blue-500 hover:bg-blue-600" size="lg">
                <Mic className="w-5 h-5 mr-2" />
                Start Recording
              </Button>
            ) : (
              <Button onClick={stopRecording} className="w-full bg-red-500 hover:bg-red-600" size="lg">
                <Square className="w-5 h-5 mr-2" />
                Stop Recording
              </Button>
            )}

            {recordedUrl && (
              <div className="space-y-4">
                <audio ref={audioRef} src={recordedUrl} onEnded={() => setIsPlaying(false)} className="hidden" />
                <Button onClick={togglePlayback} variant="outline" className="w-full">
                  {isPlaying ? (
                    <>
                      <Pause className="w-4 h-4 mr-2" />
                      Pause Playback
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Play Recording
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          <p className="text-sm text-gray-500">Record at least 30 seconds for better voice analysis</p>
        </div>
      </CardContent>
    </Card>
  )
}
