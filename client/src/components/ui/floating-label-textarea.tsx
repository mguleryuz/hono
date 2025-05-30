import * as React from 'react'
import { Textarea } from '@c/components/ui/textarea'
import { cn } from '@c/utils'

import { FloatingLabel } from './floating-label-input'

const FloatingTextarea = ({
  className,
  ...props
}: React.ComponentProps<'textarea'>) => {
  return (
    <Textarea
      data-slot="floating-textarea"
      placeholder=" "
      className={cn('peer', className)}
      {...props}
    />
  )
}
FloatingTextarea.displayName = 'FloatingTextarea'

type FloatingLabelTextareaProps = React.ComponentProps<'textarea'> & {
  label?: string
}

const FloatingLabelTextarea = ({
  id,
  label,
  ...props
}: React.PropsWithoutRef<FloatingLabelTextareaProps>) => {
  return (
    <div data-slot="floating-label-textarea" className="relative">
      <FloatingTextarea id={id} {...props} />
      <FloatingLabel htmlFor={id}>{label}</FloatingLabel>
    </div>
  )
}
FloatingLabelTextarea.displayName = 'FloatingLabelTextarea'

export { FloatingTextarea, FloatingLabelTextarea }
