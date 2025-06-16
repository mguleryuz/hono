'use client'

import { Button } from '@c/components/ui/button'
import { Link, useLocation } from '@tanstack/react-router'
import { Home, Menu } from 'lucide-react'

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
} from './ui/drawer'
import { Separator } from './ui/separator'
import { WalletWidget } from './wallet-widget'

export function Navbar() {
  const pathname = useLocation().pathname
  return (
    <div
      className={`bg-background-100/50 border-input top-0 flex w-screen items-center justify-between gap-3 border-b px-4 py-2 drop-shadow-2xl backdrop-blur-2xl`.trim()}
    >
      <div className="flex items-center gap-2">
        <Link to="/">
          <img src="/images/icon.svg" alt="Vite" width={40} height={40} />
        </Link>

        <Separator orientation="vertical" />

        <div className="hidden items-center gap-4 md:flex">
          <NavItems pathname={pathname} />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <WalletWidget size={'sm'} />

        <span className="md:hidden">
          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="outline" size="sm">
                <Menu className="h-5 w-5 fill-current" />
              </Button>
            </DrawerTrigger>
            <DrawerContent aria-describedby="mobile-menu">
              <DrawerTitle className="border-none" />
              <DrawerDescription />
              <div className="flex flex-col gap-4 p-4">
                <NavItems pathname={pathname} />
              </div>
            </DrawerContent>
          </Drawer>
        </span>
      </div>
    </div>
  )
}

const NavItems = ({ pathname }: { pathname: string }) => {
  const arr = [
    {
      href: '/',
      label: 'Home',
      icon: <Home />,
    },
  ]

  return arr.map((i, index) => {
    return (
      <Link key={index} to={i.href} className="w-full">
        <Button
          startIcon={i.icon}
          size="sm"
          variant={pathname === i.href ? 'link' : 'ghost'}
          className="w-full min-w-max justify-start truncate"
        >
          {i.label}
        </Button>
      </Link>
    )
  })
}
