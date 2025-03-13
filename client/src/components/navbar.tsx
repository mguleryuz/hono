'use client'

import { Button } from '@inverter-network/react'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
  Separator,
} from '@inverter-network/react/client'
import { Home, Menu } from 'lucide-react'
import { WalletWidget } from './wallet-widget'
import { Link, useLocation } from '@tanstack/react-router'

export function Navbar() {
  const pathname = useLocation().pathname
  return (
    <div
      className={`
      items-center py-2 px-4 flex w-screen
      justify-between gap-3 top-0 
      drop-shadow-2xl bg-background-100/50 backdrop-blur-2xl
      border-b border-input
    `.trim()}
    >
      <div className="flex items-center gap-2">
        <Link to="/">
          <img
            src="/static/light_text_icon.svg"
            alt="Inverter Network"
            className="w-18 h-18"
          />
        </Link>

        <Separator orientation="vertical" />

        <div className="items-center hidden md:flex gap-4">
          <NavItems pathname={pathname} />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <WalletWidget size={'sm'} />

        <span className="md:hidden">
          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="fill-current w-5 h-5" />
              </Button>
            </DrawerTrigger>
            <DrawerContent aria-describedby="mobile-menu">
              <DrawerTitle className="border-none" />
              <DrawerDescription />
              <div className="p-4 flex flex-col gap-4">
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
