'use client'
import React from 'react'
import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import { clsx } from 'clsx'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  centered?: boolean
}

export const PremiumEmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  centered = false
}) => {
  return (
    <div className={clsx(
      "w-full px-6 py-12 bg-white native-border rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.02)]",
      centered ? "text-center flex flex-col items-center" : "text-left"
    )}>
      <div className={clsx(
        "w-14 h-14 rounded-[16px] bg-zinc-50 flex items-center justify-center mb-6 native-border shadow-inner",
        centered ? "mx-auto" : ""
      )}>
        <Icon className="w-7 h-7 text-zinc-300" />
      </div>
      
      <h3 className="text-title-2 text-zinc-900 mb-2">
        {title}
      </h3>
      
      <p className="text-body-secondary max-w-[280px] mb-8">
        {description}
      </p>

      {actionLabel && (
        <button
          onClick={onAction}
          className="bg-zinc-900 hover:bg-zinc-800 text-white font-700 text-sm px-8 py-3 rounded-full transition-all shadow-sm active:scale-95"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
