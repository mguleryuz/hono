import { Link } from '@tanstack/react-router'

import { Button } from './button'
import { Separator } from './separator'

export function FourOFour() {
  return (
    <div className="flex flex-col gap-3">
      <h1>404 / Page Not Found</h1>
      <Separator />
      <Button asChild className="w-max">
        <Link to="/">Back</Link>
      </Button>
    </div>
  )
}
