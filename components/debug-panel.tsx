"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Settings, CheckCircle, XCircle, AlertCircle } from "lucide-react"

export default function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [validation, setValidation] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const validateKeys = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/validate-keys")
      const result = await response.json()
      setValidation(result)
    } catch (error) {
      console.error("Validation error:", error)
      setValidation({ error: "Failed to validate keys" })
    } finally {
      setIsLoading(false)
    }
  }

  const testTranscription = async () => {
    setIsLoading(true)
    try {
      // Create a simple test audio blob
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

      // Create a simple beep sound for testing
      const buffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.1, audioContext.sampleRate)
      const channelData = buffer.getChannelData(0)
      for (let i = 0; i < channelData.length; i++) {
        channelData[i] = Math.sin((2 * Math.PI * 440 * i) / audioContext.sampleRate) * 0.1
      }

      // Convert to blob (this is a simplified test)
      const testBlob = new Blob(["test audio data"], { type: "audio/webm" })

      const formData = new FormData()
      formData.append("audio", testBlob, "test.webm")

      const response = await fetch("/api/test-transcribe", {
        method: "POST",
        body: formData,
      })

      const transcriptionResult = await response.json()
      setValidation((prev) => ({ ...prev, transcriptionTest: transcriptionResult }))
    } catch (error) {
      console.error("Transcription test error:", error)
      setValidation((prev) => ({ ...prev, transcriptionTest: { error: "Test failed" } }))
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4">
        <Button onClick={() => setIsOpen(true)} variant="outline" size="sm" className="bg-white shadow-lg">
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 w-80">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            Debug Panel
            <Button onClick={() => setIsOpen(false)} variant="ghost" size="sm" className="h-6 w-6 p-0">
              ×
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={validateKeys} disabled={isLoading} size="sm" className="w-full">
            {isLoading ? "Validating..." : "Validate API Keys"}
          </Button>

          <Button onClick={testTranscription} disabled={isLoading} size="sm" className="w-full">
            {isLoading ? "Testing..." : "Test Transcription"}
          </Button>

          {validation && (
            <div className="space-y-2">
              <div className="text-xs font-medium">API Keys Status:</div>
              {validation.keysDecoded &&
                Object.entries(validation.keysDecoded).map(([service, isValid]) => (
                  <div key={service} className="flex items-center justify-between">
                    <span className="text-xs capitalize">{service.replace("_", " ")}</span>
                    <Badge variant={isValid ? "default" : "destructive"} className="text-xs">
                      {isValid ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                      {isValid ? "Valid" : "Invalid"}
                    </Badge>
                  </div>
                ))}

              {validation.allValid ? (
                <div className="flex items-center text-green-600 text-xs">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  All keys valid
                </div>
              ) : (
                <div className="flex items-center text-red-600 text-xs">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Some keys invalid
                </div>
              )}
            </div>
          )}

          {validation?.transcriptionTest && (
            <div className="space-y-2">
              <div className="text-xs font-medium">Transcription Test:</div>
              <div className="text-xs text-gray-600">
                {validation.transcriptionTest.error ? (
                  <span className="text-red-600">{validation.transcriptionTest.error}</span>
                ) : (
                  <div>
                    <div>File received: {validation.transcriptionTest.fileReceived ? "✓" : "✗"}</div>
                    <div>API key valid: {validation.transcriptionTest.apiKeyValid ? "✓" : "✗"}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {validation?.error && <div className="text-red-600 text-xs">{validation.error}</div>}
        </CardContent>
      </Card>
    </div>
  )
}
