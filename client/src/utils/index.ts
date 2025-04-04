import { clsx } from 'clsx'
import type { ClassValue } from 'clsx'
import { toast } from 'sonner'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const copyToClipboard = async (text?: string) => {
  if (!text) return

  try {
    await navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!', {
      duration: 2000,
    })
  } catch (err) {
    console.error('Failed to copy: ', err)
    toast.error('Failed to copy')
  }
}

export * from './blockchain'
