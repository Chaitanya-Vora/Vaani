import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, Mic, Target, ChevronRight, 
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
    const onboarded = localStorage.getItem('vaani-onboarded-v3')
    if (!onboarded) {
      const timer = setTimeout(() => setShow(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  const close = () => {
    localStorage.setItem('vaani-onboarded-v3', 'true')
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
        {/* Backdrop - Apple Style Blur */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-white/80 backdrop-blur-2xl"
          onClick={close}
        />

        {/* Modal - Notis.ai Inspired Minimalism */}
        <motion.div 
          initial={{ scale: 0.98, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.98, opacity: 0, y: 10 }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="relative w-full max-w-md bg-white rounded-[40px] shadow-[0_48px_96px_-24px_rgba(0,0,0,0.12)] border border-zinc-100 overflow-hidden"
        >
          {/* Skip Button - Subtle */}
          <button 
            onClick={close}
            className="absolute top-8 right-8 z-10 p-2 hover:bg-zinc-50 rounded-full transition-colors group"
          >
            <span className="sr-only">Skip</span>
            <X className="w-5 h-5 text-zinc-300 group-hover:text-zinc-900" />
          </button>

          {/* Visual Area - Monochrome & Elegant */}
          <div className="h-56 relative flex items-center justify-center bg-zinc-50/50">
             <motion.div
               key={current}
               initial={{ scale: 0.8, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.8, opacity: 0 }}
               className="w-24 h-24 bg-white rounded-[32px] border border-zinc-100 flex items-center justify-center shadow-[0_8px_32px_-8px_rgba(0,0,0,0.08)]"
             >
               <slide.icon className="w-10 h-10 text-zinc-900 stroke-[1.5px]" />
             </motion.div>
             
             {/* Progress Pills - Modern Minimals */}
             <div className="absolute bottom-8 flex gap-2">
               {SLIDES.map((_, i) => (
                 <div key={i} className={`h-1 rounded-full transition-all duration-500 ease-out ${i === current ? 'w-8 bg-zinc-900' : 'w-2 bg-zinc-200'}`} />
               ))}
             </div>
          </div>

          {/* Content Area - Premium Spacing */}
          <div className="p-10 pt-8 text-center">
            <motion.h2 
              key={`t-${current}`}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-display font-800 text-zinc-900 tracking-tight mb-4"
            >
              {slide.title}
            </motion.h2>
            <motion.p 
              key={`d-${current}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-zinc-500 text-base leading-relaxed mb-12 px-2 font-medium"
            >
              {slide.description}
            </motion.p>

            <button
              onClick={next}
              className="w-full h-15 bg-zinc-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:bg-black shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2)]"
            >
              <span className="text-sm uppercase tracking-widest">{current === SLIDES.length - 1 ? 'Get started' : 'Next step'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            
            <p className="mt-8 text-[10px] font-bold text-zinc-300 uppercase tracking-[0.3em]">
              0{current + 1} / 0{SLIDES.length}
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
