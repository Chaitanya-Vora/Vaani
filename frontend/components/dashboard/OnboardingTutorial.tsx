import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, Mic, Target, Zap, ChevronRight, 
  Sparkles, CheckCircle2, LayoutDashboard 
} from 'lucide-react'

const SLIDES = [
  {
    title: "Multimodal Intelligence",
    description: "Experience the world's first voice-to-voice executive loop. Toggle 'Executive Audio' in Settings to receive real-time audio briefings from your assistant.",
    icon: Mic,
    color: "bg-blue-500",
    gradient: "from-blue-500/20 to-transparent"
  },
  {
    title: "Lead Sniper CRM",
    description: "Vaani automatically captures commitments and contact details from your conversations, sniping them directly into your Notion CRM vault.",
    icon: Target,
    color: "bg-orange-500",
    gradient: "from-orange-500/20 to-transparent"
  },
  {
    title: "Executive Command Center",
    description: "Track every micro-action and task capacity in real-time. Your dashboard is the single source of truth for your organizational velocity.",
    icon: LayoutDashboard,
    color: "bg-zinc-900",
    gradient: "from-zinc-900/20 to-transparent"
  }
]

export default function OnboardingTutorial() {
  const [show, setShow] = useState(false)
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const onboarded = localStorage.getItem('vaani-onboarded-v2')
    if (!onboarded) {
      const timer = setTimeout(() => setShow(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  const close = () => {
    localStorage.setItem('vaani-onboarded-v2', 'true')
    setShow(false)
  }

  const next = () => {
    if (current < SLIDES.length - 1) {
      setCurrent(curr => curr + 1)
    } else {
      close()
    }
  }

  if (!show) return null

  const slide = SLIDES[current]

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-white/60 backdrop-blur-xl"
          onClick={close}
        />

        {/* Modal */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-md bg-white rounded-[32px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-zinc-100 overflow-hidden"
        >
          {/* Skip Button */}
          <button 
            onClick={close}
            className="absolute top-6 right-6 z-10 p-2 hover:bg-zinc-50 rounded-full transition-colors group"
          >
            <span className="sr-only">Skip</span>
            <X className="w-5 h-5 text-zinc-400 group-hover:text-zinc-900" />
          </button>

          {/* Visual Area */}
          <div className={`h-48 relative flex items-center justify-center bg-gradient-to-b ${slide.gradient}`}>
             <motion.div
               key={current}
               initial={{ scale: 0.5, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               transition={{ type: 'spring', damping: 15 }}
               className={`w-20 h-20 ${slide.color} rounded-3xl flex items-center justify-center shadow-2xl shadow-zinc-200`}
             >
               <slide.icon className="w-10 h-10 text-white" />
             </motion.div>
             
             {/* Progress Pills */}
             <div className="absolute bottom-6 flex gap-1.5">
               {SLIDES.map((_, i) => (
                 <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === current ? 'w-6 bg-zinc-900' : 'w-1.5 bg-zinc-200'}`} />
               ))}
             </div>
          </div>

          {/* Content Area */}
          <div className="p-8 pt-10 text-center">
            <motion.h2 
              key={`t-${current}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-display font-800 text-zinc-900 tracking-tight mb-3"
            >
              {slide.title}
            </motion.h2>
            <motion.p 
              key={`d-${current}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="text-zinc-500 text-base leading-relaxed mb-10 px-4"
            >
              {slide.description}
            </motion.p>

            <button
              onClick={next}
              className="w-full h-14 bg-zinc-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:bg-zinc-800 shadow-xl shadow-zinc-900/10"
            >
              {current === SLIDES.length - 1 ? 'Get Started' : 'Next Step'}
              <ChevronRight className="w-5 h-5" />
            </button>
            
            <p className="mt-6 text-[11px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
              Step {current + 1} of {SLIDES.length}
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
