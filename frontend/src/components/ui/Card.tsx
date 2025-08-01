import React from 'react'
import { clsx } from 'clsx'

interface CardProps {
  children: React.ReactNode
  className?: string
}

interface CardHeaderProps {
  children: React.ReactNode
  className?: string
}

interface CardContentProps {
  children: React.ReactNode
  className?: string
}

interface CardTitleProps {
  children: React.ReactNode
  className?: string
}

export const Card: React.FC<CardProps> = ({ children, className }) => {
  return (
    <div className={clsx(
      'rounded-lg border bg-card text-card-foreground shadow-sm',
      'bg-white border-gray-200',
      className
    )}>
      {children}
    </div>
  )
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className }) => {
  return (
    <div className={clsx('flex flex-col space-y-1.5 p-6', className)}>
      {children}
    </div>
  )
}

export const CardTitle: React.FC<CardTitleProps> = ({ children, className }) => {
  return (
    <h3 className={clsx(
      'text-2xl font-semibold leading-none tracking-tight',
      className
    )}>
      {children}
    </h3>
  )
}

export const CardContent: React.FC<CardContentProps> = ({ children, className }) => {
  return (
    <div className={clsx('p-6 pt-0', className)}>
      {children}
    </div>
  )
}
