"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import HeroSection from "@/components/hero-section"
import PremiumVoiceCloner from "@/components/premium-voice-cloner"
import PremiumVoiceChat from "@/components/premium-voice-chat"
import ApiTestPanel from "@/components/api-test-panel"
import { ArrowLeft, CheckCircle, Sparkles, Zap } from "lucide-react"

export default function HomePage() {
  const [step, setStep] = useState<"hero" | "clone" | "chat">("hero")
  const [voiceData, setVoiceData] = useState<{
    voiceId: string
    audioUrl: string
  } | null>(null)
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleGetStarted = () => {
    setStep("clone")
  }

  const handleVoiceCloned = (voiceId: string, audioUrl: string) => {
    setVoiceData({ voiceId, audioUrl })
    setStep("chat")
  }

  const resetToClone = () => {
    setStep("clone")
    setVoiceData(null)
  }

  const backToHero = () => {
    setStep("hero")
    setVoiceData(null)
  }

  if (step === "hero") {
    return <HeroSection onGetStarted={handleGetStarted} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black relative overflow-hidden">
      {/* Flowing Background Lines */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent"
          style={{ transform: `translateX(${scrollY * 0.3}px)` }}
        />
        <div
          className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-yellow-400/20 to-transparent"
          style={{ transform: `translateX(${-scrollY * 0.2}px)` }}
        />
        <div
          className="absolute top-3/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-yellow-600/25 to-transparent"
          style={{ transform: `translateX(${scrollY * 0.4}px)` }}
        />
      </div>

      <div className="relative z-10 min-h-screen px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <header className="pt-8 pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <Button
                  onClick={step === "chat" ? resetToClone : backToHero}
                  variant="outline"
                  className="glass-dark border-yellow-500/30 text-white hover:bg-yellow-500/10"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 gradient-gold-bg rounded-xl flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold gradient-gold">Resona</h1>
                    <p className="text-gray-400 text-sm">Revolutionary Voice Technology</p>
                  </div>
                </div>
              </div>

              <Badge className="gradient-gold-bg text-black px-6 py-2 font-semibold">Neural Technology</Badge>
            </div>
          </header>

          {/* Progress Indicator */}
          <div className="flex justify-center mb-12">
            <div className="flex items-center space-x-8">
              <div
                className={`flex items-center space-x-4 px-6 py-3 rounded-2xl transition-all duration-500 ${
                  step === "clone"
                    ? "glass-dark border border-yellow-500/30 glow-gold"
                    : "glass-dark border border-green-500/30"
                }`}
              >
                {step === "chat" ? (
                  <CheckCircle className="w-6 h-6 text-green-400" />
                ) : (
                  <Zap className="w-6 h-6 text-yellow-400" />
                )}
                <span className="text-white font-semibold text-lg">Clone Voice</span>
              </div>

              <div className="w-16 h-px bg-gradient-to-r from-yellow-500/50 to-blue-500/50 rounded-full"></div>

              <div
                className={`flex items-center space-x-4 px-6 py-3 rounded-2xl transition-all duration-500 ${
                  step === "chat"
                    ? "glass-dark border border-yellow-500/30 glow-gold"
                    : "glass-dark border border-gray-600/30"
                }`}
              >
                <Sparkles className={`w-6 h-6 ${step === "chat" ? "text-yellow-400" : "text-gray-500"}`} />
                <span className={`font-semibold text-lg ${step === "chat" ? "text-white" : "text-gray-500"}`}>
                  Voice Chat
                </span>
              </div>
            </div>
          </div>

          {/* API Test Panel - Only show in development */}
          {process.env.NODE_ENV === "development" && (
            <div className="mb-8">
              <ApiTestPanel />
            </div>
          )}

          {/* Main Content */}
          <main className="pb-20">
            {step === "clone" && <PremiumVoiceCloner onVoiceCloned={handleVoiceCloned} />}

            {step === "chat" && voiceData && (
              <div className="space-y-8">
                {/* Success Banner */}
                <Card className="glass-dark border-green-500/30 shadow-2xl glow-gold">
                  <CardContent className="p-8">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-6">
                        <div className="w-16 h-16 gradient-gold-bg rounded-2xl flex items-center justify-center">
                          <CheckCircle className="w-8 h-8 text-black" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-white mb-2">🌟 Voice Clone Complete!</h3>
                          <p className="text-green-300 text-lg">AI has successfully adopted the inputted voice!</p>
                        </div>
                      </div>
                      <Button
                        onClick={resetToClone}
                        variant="outline"
                        className="glass-dark border-yellow-500/30 text-white hover:bg-yellow-500/10 px-6 py-3"
                      >
                        Create New Clone
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <PremiumVoiceChat voiceId={voiceData.voiceId} sampleAudioUrl={voiceData.audioUrl} />
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
