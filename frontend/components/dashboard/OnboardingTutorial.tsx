import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, Mic, Target, ChevronRight, ChevronLeft, 
  LayoutDashboard 
} from 'lucide-react'

const SLIDES = [
  {
    title: "Multimodal intelligence",
    description: "Experience the world's first voice-to-voice executive loop. Toggle 'Executive audio' in settings to receive real-time audio briefings from your assistant.",
    icon: Mic,
  },
  {
    title: "Lead sniper CRM",
    description: "Vaani automatically captures commitments and contact details from your conversations, sniping them directly into your Notion CRM vault.",
    icon: Target,
  },
  {
    title: "Executive command center",
    description: "Track every micro-action and task capacity in real-time. Your dashboard is the single source of truth for your organizational velocity.",
    icon: LayoutDashboard,
  }
]

export default function OnboardingTutorial() {
  const [show, setShow] = useState(false)
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    // Force show for v4 alignment
    const onboarded = localStorage.getItem('vaani-onboarded-v4')
    if (!onboarded) {
      const timer = setTimeout(() => setShow(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  const close = () => {
    localStorage.setItem('vaani-onboarded-v4', 'true')
    setShow(false)
  }

  const next = () => {
    if (current < SLIDES.length - 1) {
      setCurrent(curr => curr + 1)
    } else {
      close()
    }
  }

  const prev = () => {
    if (current > 0) {
      setCurrent(curr => curr - 1)
    }
  }

  if (!show) return null

  const slide = SLIDES[current]

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop - Apple Style Blur */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-white/80 backdrop-blur-3xl"
          onClick={close}
        />

        {/* Modal - Museum Grade Spacing */}
        <motion.div 
          initial={{ scale: 0.96, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative w-full max-w-lg bg-white rounded-[48px] shadow-[0_64px_128px_-32px_rgba(0,0,0,0.15)] border border-zinc-100 overflow-hidden"
        >
          {/* Close/Skip Button */}
          <button 
            onClick={close}
            className="absolute top-10 right-10 z-10 p-2 hover:bg-zinc-50 rounded-full transition-colors group"
          >
            <span className="sr-only">Skip</span>
            <X className="w-6 h-6 text-zinc-300 group-hover:text-zinc-900" />
          </button>

          {/* Visual Area - High Fidelity Minimalism */}
          <div className="h-72 relative flex items-center justify-center bg-zinc-50/30 border-b border-zinc-50">
             <motion.div
               key={current}
               initial={{ scale: 0.9, opacity: 0, filter: 'blur(10px)' }}
               animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
               exit={{ scale: 0.9, opacity: 0, filter: 'blur(10px)' }}
               className="w-28 h-28 bg-white rounded-[40px] border border-zinc-100 flex items-center justify-center shadow-[0_12px_48px_-12px_rgba(0,0,0,0.1)]"
             >
               <slide.icon className="w-12 h-12 text-zinc-900 stroke-[1.2px]" />
             </motion.div>
             
             {/* Progress Indicators */}
             <div className="absolute bottom-10 flex gap-3">
               {SLIDES.map((_, i) => (
                 <div key={i} className={`h-1.5 rounded-full transition-all duration-700 ease-in-out ${i === current ? 'w-10 bg-zinc-900' : 'w-2 bg-zinc-200'}`} />
               ))}
             </div>
          </div>

          {/* Content Area - Spacious vertical rhythm */}
          <div className="p-12 sm:p-16 text-center space-y-10">
            <div className="space-y-4">
              <motion.h2 
                key={`t-${current}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-display font-800 text-zinc-900 tracking-tight"
              >
                {slide.title}
              </motion.h2>
              <motion.p 
                key={`d-${current}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="text-zinc-500 text-lg leading-relaxed px-4 font-medium"
              >
                {slide.description}
              </motion.p>
            </div>

            <div className="flex gap-4 items-center">
              {current > 0 && (
                <button
                  onClick={prev}
                  className="h-16 w-16 bg-zinc-50 text-zinc-400 rounded-3xl flex items-center justify-center active:scale-95 transition-all hover:bg-zinc-100 hover:text-zinc-900"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}
              
              <button
                onClick={next}
                className="flex-1 h-16 bg-zinc-900 text-white rounded-[24px] font-bold flex items-center justify-center gap-3 active:scale-[0.98] transition-all hover:bg-black shadow-[0_24px_48px_-12px_rgba(0,0,0,0.25)] group"
              >
                <span className="text-sm uppercase tracking-[0.2em] font-800 ml-2">
                  {current === SLIDES.length - 1 ? 'Get started' : 'Continue'}
                </span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            
            <p className="text-[12px] font-bold text-zinc-300 uppercase tracking-[0.4em] pt-2">
              Step 0{current + 1} of 0{SLIDES.length}
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
