import * as React from 'react'
import { Input } from '@c/components/ui/input'
import { Label } from '@c/components/ui/label'
import { cn } from '@c/utils'

const FloatingInput = ({
  className,
  ...props
}: React.ComponentProps<'input'>) => {
  return (
    <Input
      data-slot="floating-input"
      placeholder=" "
      className={cn('peer', className)}
      {...props}
    />
  )
}
FloatingInput.displayName = 'FloatingInput'

const FloatingLabel = ({
  className,
  ...props
}: React.ComponentProps<'label'>) => {
  return (
    <Label
      data-slot="floating-label"
      className={cn(
        'peer-focus:secondary peer-focus:dark:secondary bg-background dark:bg-background absolute start-2 top-2 z-10 origin-[0] -translate-y-4 scale-75 transform px-2 text-sm text-gray-500 duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100 peer-focus:top-2 peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:px-2 rtl:peer-focus:left-auto rtl:peer-focus:translate-x-1/4',
        className
      )}
      {...props}
    />
  )
}
FloatingLabel.displayName = 'FloatingLabel'

type FloatingLabelInputProps = React.ComponentProps<'input'> & {
  label?: string
}

const FloatingLabelInput = ({
  id,
  label,
  ...props
}: FloatingLabelInputProps) => {
  return (
    <div data-slot="floating-label-input" className="relative">
      <FloatingInput id={id} {...props} />
      <FloatingLabel htmlFor={id}>{label}</FloatingLabel>
    </div>
  )
}
FloatingLabelInput.displayName = 'FloatingLabelInput'

export { FloatingInput, FloatingLabel, FloatingLabelInput }
