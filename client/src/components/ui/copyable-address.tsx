'use client'

import { Button } from '@c/components/ui/button'
import { cn } from '@c/utils'
import { Copy } from 'lucide-react'
import { toast } from 'sonner'

export const CopyableAddress = ({
  name,
  address,
  onCodeClick = () => {},
}: {
  name?: string
  address: string
  onCodeClick?: () => void
}) => {
  const handleCopy = async (text: string, label = 'Copied Successfully') => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(label)
    } catch (err) {
      console.error(err)
    }
  }

  const truncateAddress = (address: string) => {
    if (!address) return address
    const start = address.slice(0, 6)
    const end = address.slice(-4)
    return `${start}...${end}`
  }

  return (
    <div className="flex w-fit items-center gap-2">
      <code
        className={cn(
          'bg-muted max-w-[150px] truncate rounded px-2 py-1 text-xs sm:max-w-none sm:text-sm',
          {
            'cursor-pointer hover:underline': Boolean(onCodeClick),
          }
        )}
        onClick={onCodeClick}
      >
        {name || truncateAddress(address)}
      </code>
      <Button
        variant="ghost"
        size="icon"
        className="hover:text-primary h-10 w-10 cursor-pointer hover:!bg-transparent"
        onClick={() => handleCopy(address)}
      >
        <Copy className="h-4 w-4" />
      </Button>
    </div>
  )
}
