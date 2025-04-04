import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'
import type { VariantProps } from 'class-variance-authority'
import { cn } from '@c/utils'
import { loaders } from './spinner'

const buttonVariants = cva(
  'animate-pop active:scale-95 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive-hover active:bg-destructive-active',
        outline:
          'border border-input bg-background hover:bg-secondary hover:text-secondary-foreground active:bg-secondary-active',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary-hover active:bg-secondary-active',
        ghost: 'hover:bg-secondary hover:text-secondary-foreground',
        link: 'text-link underline-offset-4 hover:underline active:text-link-active',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  startIcon?: React.ReactNode
  endIcon?: React.ReactNode
  loader?: keyof typeof loaders
}

const Button = ({
  ref,
  className,
  variant,
  size,
  asChild = false,
  loading,
  startIcon,
  endIcon,
  children,
  loader = 'PinWheel',
  ...props
}: ButtonProps & { ref?: React.RefObject<HTMLButtonElement | null> }) => {
  const Comp = asChild ? Slot : 'button'
  const Loader = loaders[loader]

  let finalChildren = children

  if (startIcon || loading || endIcon) {
    const elements: React.ReactNode[] = []
    if (startIcon) {
      elements.push(
        <span key="start-icon" className={cn(!!children && 'mr-2')}>
          {startIcon}
        </span>
      )
    }
    if (loading) {
      elements.push(
        <Loader
          key="loader"
          className={cn('h-4 w-4 animate-spin', !!children && 'mr-2')}
        />
      )
    }
    if (children) {
      elements.push(<React.Fragment key="children">{children}</React.Fragment>)
    }
    if (endIcon) {
      elements.push(
        <span key="end-icon" className={cn(!!children && 'ml-2')}>
          {endIcon}
        </span>
      )
    }
    finalChildren = elements
  }

  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      disabled={loading}
      {...props}
    >
      {finalChildren}
    </Comp>
  )
}
Button.displayName = 'Button'

export { Button, buttonVariants }
