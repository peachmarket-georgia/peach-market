'use client'

import { cn } from '@/lib/utils'

type Step = {
  label: string
  completed?: boolean
}

type StepIndicatorProps = {
  steps: Step[]
  currentStep: number
  className?: string
}

export function StepIndicator({ steps, currentStep, className }: StepIndicatorProps) {
  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <div className={cn('w-full', className)}>
      {/* 프로그레스 바 */}
      <div className="relative h-1.5 bg-peach-muted rounded-full overflow-hidden mb-3">
        <div
          className="absolute left-0 top-0 h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* 단계 라벨 */}
      <div className="flex justify-between">
        {steps.map((step, index) => {
          const isActive = index === currentStep
          const isCompleted = index < currentStep || step.completed

          return (
            <div
              key={step.label}
              className={cn(
                'flex items-center gap-1.5 text-xs font-medium transition-colors',
                isActive ? 'text-primary' : isCompleted ? 'text-fg-secondary' : 'text-fg-tertiary'
              )}
            >
              <span
                className={cn(
                  'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all',
                  isActive
                    ? 'bg-primary text-white'
                    : isCompleted
                      ? 'bg-primary/20 text-primary'
                      : 'bg-peach-muted text-fg-tertiary'
                )}
              >
                {isCompleted && index < currentStep ? '✓' : index + 1}
              </span>
              <span className="hidden sm:inline">{step.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
