'use client'

import { useRef } from 'react'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { FeedbackButton as FeedbacklandButton } from 'feedbackland-react'

export function FeedbackButton() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  if (pathname.startsWith('/chat')) return null

  const handleClick = () => {
    const btn = wrapperRef.current?.querySelector('button')
    btn?.click()
  }

  return (
    <>
      <div ref={wrapperRef} className="fixed bottom-6 right-6 opacity-0 pointer-events-none z-[-1]">
        <FeedbacklandButton
          platformId="fef1fab9-adbc-4e89-9fe8-338380d84058"
          widget="popover"
          url="https://peachmarket.feedbackland.com/"
          text="Feedback"
        />
      </div>

      {/* 피치 아이콘 버튼 */}
      <button
        onClick={handleClick}
        className="fixed bottom-6 right-6 z-50 active:scale-95 peach-wiggle"
        aria-label="Feedback"
      >
        <div className="relative">
          <Image
            src="/bubble-hover-2-removebg-preview.png"
            alt=""
            width={60}
            height={60}
            className="absolute -top-5 -left-6 w-8 h-8 md:-top-8 md:-left-12 md:w-15 md:h-15"
          />
          <Image
            src="/peach-icon-32-removebg-preview.png"
            alt="Feedback"
            width={72}
            height={72}
            className="w-12 h-12 md:w-18 md:h-18"
          />
        </div>
      </button>
    </>
  )
}
