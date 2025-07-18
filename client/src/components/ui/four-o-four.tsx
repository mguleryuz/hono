import { Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'

import { Button } from './button'
import { Card, CardContent } from './card'

export function FourOFour() {
  return (
    <div className="flex h-96 items-center justify-center">
      <Card className="m-auto max-w-md">
        <CardContent className="pt-6">
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full">
              <img
                src="/images/icon.png"
                alt="App Logo"
                className="h-16 w-16"
                loading="eager"
                decoding="sync"
                width="64"
                height="64"
              />
            </div>
            <div>
              <h2 className="text-primary text-xl font-semibold">
                Ooops, looks like we lost the track...
              </h2>
            </div>
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
              >
                Try Again
              </Button>
              <Button asChild size="sm">
                <Link to="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to the homepage
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
