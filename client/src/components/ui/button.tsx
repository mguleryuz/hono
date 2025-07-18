import * as React from 'react'
import { loaders } from '@c/components/ui/spinner'
import { cn } from '@c/utils'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90',
        destructive:
          'bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'border bg-background shadow-xs hover:bg-accent hover:text-white dark:bg-input/30 dark:border-input dark:hover:bg-input/50 dark:hover:text-white',
        secondary:
          'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80',
        ghost:
          'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    startIcon?: React.ReactNode
    endIcon?: React.ReactNode
    loading?: boolean
    loader?: 'Loader' | 'Loader2' | 'PinWheel' | 'Lucide' | 'Icon'
  }

function Button({
  className,
  variant,
  size,
  asChild = false,
  startIcon,
  endIcon,
  loading,
  loader = 'PinWheel',
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button'
  const Loader = loaders[loader]

  const renderContent = () => {
    const hasChildren = !!children
    const content: React.ReactNode[] = []

    if (startIcon) {
      content.push(
        <span key="start-icon" className={cn(hasChildren && 'mr-2')}>
          {startIcon}
        </span>
      )
    }

    if (loading) {
      content.push(
        <Loader
          key="loader"
          className={cn('h-4 w-4 animate-spin', hasChildren && 'mr-2')}
        />
      )
    }

    if (hasChildren) {
      content.push(<React.Fragment key="children">{children}</React.Fragment>)
    }

    if (endIcon) {
      content.push(
        <span key="end-icon" className={cn(hasChildren && 'ml-2')}>
          {endIcon}
        </span>
      )
    }

    return content.length > 0 ? content : children
  }

  const { disabled, ...rest } = props

  return (
    <Comp
      data-slot="button"
      disabled={loading || disabled}
      className={cn(buttonVariants({ variant, size, className }))}
      {...rest}
    >
      {asChild ? children : renderContent()}
    </Comp>
  )
}

export { Button, buttonVariants }
