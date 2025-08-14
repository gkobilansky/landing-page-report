import React from 'react'

interface MetricsGridProps {
  children: React.ReactNode
  className?: string
}

interface MetricItemProps {
  label: string
  value: string | number
  colorTheme?: string
}

export function MetricsGrid({ children, className = "" }: MetricsGridProps) {
  return (
    <div className={`grid grid-cols-2 gap-4 text-sm mb-6 ${className}`}>
      {children}
    </div>
  )
}

export function MetricItem({ label, value, colorTheme = "gray" }: MetricItemProps) {
  return (
    <div className="flex flex-col">
      <span className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-1">{label}</span>
      <span className={`text-gray-100 font-semibold`}>{value}</span>
    </div>
  )
} 