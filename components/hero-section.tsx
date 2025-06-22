"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Mic, ArrowRight, Sparkles, Zap, Volume2 } from "lucide-react"

interface HeroSectionProps {
  onGetStarted: () => void
}

export default function HeroSection({ onGetStarted }: HeroSectionProps) {
  const [scrollY, setScrollY] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", handleScroll)
    setIsVisible(true)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-black via-gray-900 to-black overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Flowing Gold Lines */}
        <div
          className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-30"
          style={{ transform: `translateX(${scrollY * 0.5}px)` }}
        />
        <div
          className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-yellow-400 to-transparent opacity-20"
          style={{ transform: `translateX(${-scrollY * 0.3}px)` }}
        />
        <div
          className="absolute top-3/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-yellow-600 to-transparent opacity-25"
          style={{ transform: `translateX(${scrollY * 0.4}px)` }}
        />

        {/* Subtle Orbs */}
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl soul-orb" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl soul-orb" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-6">
        <div
          className={`text-center max-w-6xl mx-auto transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
        >
          {/* Badge */}
          <div className="mb-8 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <Badge className="glass-dark text-yellow-400 border-yellow-500/30 px-6 py-2 text-sm font-medium">
              <Sparkles className="w-4 h-4 mr-2" />
              Revolutionary Neural Technology
            </Badge>
          </div>

          {/* Main Heading */}
          <div className="mb-8 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
            <h1 className="text-7xl md:text-9xl font-bold mb-4 leading-none">
              <span className="text-white">Resona</span>
            </h1>
            <div className="flowing-line mb-6">
              <h2 className="text-2xl md:text-4xl font-light text-gray-300">
                Any Voice. <span className="gradient-gold font-semibold">Reimagined.</span>
              </h2>
            </div>
          </div>

          {/* Subheading */}
          <p
            className="text-xl md:text-2xl text-gray-400 mb-12 max-w-4xl mx-auto leading-relaxed font-light animate-fade-in-up"
            style={{ animationDelay: "0.6s" }}
          >
            Clone any voice with unprecedented accuracy and engage with an AI that speaks with the exact vocal
            signature.
          </p>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 max-w-4xl mx-auto">
            <div className="text-center animate-fade-in-left" style={{ animationDelay: "0.8s" }}>
              <div className="w-16 h-16 mx-auto mb-4 glass-dark rounded-2xl flex items-center justify-center glow-gold">
                <Zap className="w-8 h-8 text-yellow-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Neural Precision</h3>
              <p className="text-gray-400">99.9% voice matching with advanced neural networks through ElevenLabs</p>
            </div>

            <div className="text-center animate-scale-in" style={{ animationDelay: "1s" }}>
              <div className="w-16 h-16 mx-auto mb-4 glass-dark rounded-2xl flex items-center justify-center glow-gold">
                <Volume2 className="w-8 h-8 text-yellow-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Real-time Synthesis</h3>
              <p className="text-gray-400">Instant Vapi voice generation with emotional depth</p>
            </div>

            <div className="text-center animate-fade-in-right" style={{ animationDelay: "1.2s" }}>
              <div className="w-16 h-16 mx-auto mb-4 glass-dark rounded-2xl flex items-center justify-center glow-gold">
                <Sparkles className="w-8 h-8 text-yellow-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Conscious AI</h3>
              <p className="text-gray-400">Powered by Groq's lightning-fast processing</p>
            </div>
          </div>

          {/* CTA */}
          <div className="animate-fade-in-up" style={{ animationDelay: "1.4s" }}>
            <Button
              onClick={onGetStarted}
              size="lg"
              className="gradient-gold-bg hover:shadow-2xl hover:shadow-yellow-500/25 text-black px-12 py-6 text-xl font-semibold rounded-2xl transition-all duration-300 group"
            >
              <Mic className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" />
              Experience Resona
              <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          {/* Stats */}
          <div
            className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-12 max-w-3xl mx-auto animate-fade-in-up"
            style={{ animationDelay: "1.6s" }}
          >
            <div className="text-center">
              <div className="text-4xl font-bold gradient-gold mb-2 text-shadow-gold">99.9%</div>
              <div className="text-gray-400 text-lg">Voice Fidelity</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold gradient-gold mb-2 text-shadow-gold">&lt;30s</div>
              <div className="text-gray-400 text-lg">Clone Time</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold gradient-gold mb-2 text-shadow-gold">∞</div>
              <div className="text-gray-400 text-lg">Possibilities</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-yellow-400/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-yellow-400/70 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </div>
  )
}
