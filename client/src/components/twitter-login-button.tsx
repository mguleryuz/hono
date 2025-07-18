import { Avatar, AvatarFallback, AvatarImage } from '@c/components/ui/avatar'
import { Button, type ButtonProps } from '@c/components/ui/button'
import { useAuthX } from '@c/hooks'
import { Link, useLocation } from '@tanstack/react-router'
import { UserIcon } from 'lucide-react'
import { FaSquareXTwitter } from 'react-icons/fa6'

export function TwitterLoginButton({
  className,
  variant,
}: {
  className?: string
  variant?: ButtonProps['variant']
}) {
  const auth = useAuthX()
  const location = useLocation()

  // Create login URL with returnTo parameter
  const loginUrl = `/api/auth/x/login?returnTo=${encodeURIComponent(location.pathname)}`

  if (auth.isLoading)
    return (
      <Button variant={variant} disabled className={className}>
        <FaSquareXTwitter className="mr-2 size-4" />
        Login
      </Button>
    )

  if (!auth.isLoggedIn)
    return (
      <Button variant={variant} asChild className={className}>
        <a href={loginUrl}>
          <FaSquareXTwitter className="mr-2 size-4" />
          Login
        </a>
      </Button>
    )

  return (
    <Link to="/" className={className}>
      <Button variant="outline" className="flex w-full items-center gap-2">
        <Avatar className="size-7">
          <AvatarImage
            src={auth.data?.x_profile_image_url}
            alt={auth.data?.x_display_name}
          />
          <AvatarFallback>
            <UserIcon className="size-4" />
          </AvatarFallback>
        </Avatar>
        <span className="max-w-[150px] truncate">
          {`@${auth.data?.x_username}` || auth.data?.x_display_name}
        </span>
      </Button>
    </Link>
  )
}
