'use client'

import { useState, useEffect } from 'react'

const themes = [
  'light', 'dark', 'cupcake', 'bumblebee', 'emerald', 'corporate', 
  'synthwave', 'retro', 'cyberpunk', 'valentine', 'halloween', 'garden',
  'forest', 'aqua', 'lofi', 'pastel', 'fantasy', 'wireframe', 'black',
  'luxury', 'dracula', 'cmyk', 'autumn', 'business', 'acid', 'lemonade',
  'night', 'coffee', 'winter'
]

export default function ThemeController() {
  const [currentTheme, setCurrentTheme] = useState('cupcake')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Get theme from localStorage or default to 'cupcake'
    const savedTheme = localStorage.getItem('theme') || 'cupcake'
    setCurrentTheme(savedTheme)
    document.documentElement.setAttribute('data-theme', savedTheme)
  }, [])

  const handleThemeChange = (theme: string) => {
    setCurrentTheme(theme)
    localStorage.setItem('theme', theme)
    document.documentElement.setAttribute('data-theme', theme)
    // Force a re-render by updating the body class
    document.body.className = document.body.className
  }

  // Don't render on server side to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="btn btn-ghost gap-1 normal-case">
        <span className="loading loading-spinner loading-sm"></span>
      </div>
    )
  }

  return (
    <div className="dropdown dropdown-end">
      <div 
        tabIndex={0} 
        role="button" 
        className="btn btn-ghost gap-1 normal-case"
      >
        <svg
          width="20"
          height="20"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          className="h-5 w-5 stroke-current"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5H9m12 0a2 2 0 00-2-2H9m12 2v6m-12-6v6m12 0a2 2 0 01-2 2H9m12-2v6a4 4 0 01-4 4H9"
          />
        </svg>
        <span className="hidden lg:inline capitalize">{currentTheme}</span>
        <svg
          width="12px"
          height="12px"
          className="h-2 w-2 fill-current opacity-60 inline-block"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 2048 2048"
        >
          <path d="M1799 349l242 241-1017 1017L7 590l242-241 775 775 775-775z" />
        </svg>
      </div>
      <ul className="dropdown-content z-[1] p-2 shadow-2xl bg-base-300 rounded-box w-52 max-h-96 overflow-y-auto">
        {themes.map((theme) => (
          <li key={theme}>
            <button
              className={`btn btn-sm btn-block btn-ghost justify-start ${currentTheme === theme ? 'btn-active' : ''}`}
              onClick={() => handleThemeChange(theme)}
            >
              <span className="capitalize">{theme}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
} 