import { Link } from '@tanstack/react-router'

import { Button } from './button'
import { JsonView } from './json-view'

export function HasError({ error, reset }: { error: any; reset?: () => void }) {
  return (
    <div className="flex flex-col gap-5">
      <h1>We Have Encountered An Error</h1>
      <JsonView json={error} />
      <div className="flex gap-5">
        <Button asChild>
          <Link to="/">Back</Link>
        </Button>
        {!!reset && (
          <Button
            onClick={
              // Attempt to recover by trying to re-render the segment
              () => reset()
            }
          >
            Try again
          </Button>
        )}
      </div>
    </div>
  )
}
