import { Button } from './button'
import { Separator } from './separator'
import { Link } from '@tanstack/react-router'

export function NoAccess() {
  return (
    <div className="flex flex-col gap-3">
      <h1>You Dont Have Access To Visit this Page</h1>
      <Separator />
      <Button asChild className="w-max">
        <Link to="/">Back</Link>
      </Button>
    </div>
  )
}
