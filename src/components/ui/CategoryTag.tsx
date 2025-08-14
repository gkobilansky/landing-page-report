import React from 'react'

interface CategoryTagProps {
  children: React.ReactNode
  colorTheme: string
}

export default function CategoryTag({ children, colorTheme }: CategoryTagProps) {
  return (
    <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-medium bg-${colorTheme}-900/20 text-${colorTheme}-300 border border-${colorTheme}-800/30`}>
      {children}
    </span>
  )
} 