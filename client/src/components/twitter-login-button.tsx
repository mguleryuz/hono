import { Button, type ButtonProps } from '@c/components/ui/button'
import { useAuthX } from '@c/hooks'

export function TwitterLoginButton({
  className,
  variant,
}: {
  className?: string
  variant?: ButtonProps['variant']
}) {
  const auth = useAuthX()

  if (auth.isPending || auth.logout.isPending)
    return (
      <Button variant={variant} disabled className={className}>
        Login X
      </Button>
    )

  if (!auth.isLoggedIn)
    return (
      <a href="/api/auth/x/login">
        <Button variant={variant} className={className}>
          Login X
        </Button>
      </a>
    )

  return (
    <Button
      variant={variant}
      className={className}
      onClick={() => {
        auth.logout.mutate()
      }}
    >
      Sign Out
    </Button>
  )
}
