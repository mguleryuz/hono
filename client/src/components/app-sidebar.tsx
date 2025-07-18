'use client'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@c/components/ui/sidebar'
import { cn } from '@c/utils'
import { Link, useLocation } from '@tanstack/react-router'
import { Image, type LucideIcon } from 'lucide-react'
import type { IconType } from 'react-icons'
import { HiMiniSparkles } from 'react-icons/hi2'

import { ThemeSwitcher } from './theme-switcher'

interface MenuItem {
  to: string
  icon: LucideIcon | IconType
  label: string
  tooltip: string
}

const menuItems: MenuItem[] = [
  {
    to: '/',
    icon: HiMiniSparkles,
    label: 'Home',
    tooltip: 'Home',
  },
  {
    to: '/media-kit',
    icon: Image,
    label: 'Media Kit',
    tooltip: 'Download Brand Assets',
  },
]

export function AppSidebar() {
  const location = useLocation()
  const pathname = location.pathname
  const { open, isMobile, openMobile } = useSidebar()

  // On mobile, use openMobile state; on desktop, use open state
  const isExpanded = isMobile ? openMobile : open

  return (
    <Sidebar collapsible="icon" className="sidebar-backdrop border-r">
      <SidebarHeader className="border-border/50 gradient border-t border-b bg-gradient-to-br">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              tooltip={!isExpanded ? '<app_title>' : undefined}
              className={isExpanded ? 'hover:bg-transparent!' : ''}
            >
              <Link
                to="/"
                className={cn(
                  'group flex items-center gap-3 px-2 py-3',
                  !isExpanded && 'justify-center px-0'
                )}
              >
                <div className="relative flex-shrink-0">
                  <img
                    src="/images/icon.png"
                    alt="App Logo"
                    className="relative z-10 size-10 object-contain"
                    loading="eager"
                    decoding="sync"
                    width="40"
                    height="40"
                  />
                </div>
                {isExpanded && (
                  <div className="flex flex-col gap-0.5 font-[Satoshi-Black] leading-none">
                    <span className="from-primary via-foreground to-primary bg-gradient-to-r bg-clip-text text-lg font-bold text-transparent">
                      {'<app_title>'}
                    </span>
                  </div>
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarMenu className="flex h-full flex-col">
          <div className="flex-1 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.to}
                    tooltip={item.tooltip}
                    className="group relative h-12 overflow-hidden"
                  >
                    <Link to={item.to}>
                      <div className="absolute inset-0" />
                      <Icon className="relative z-10 size-5" />
                      <span className="relative z-10 font-medium">
                        {item.label}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </div>
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-border/50 gradient border-t bg-gradient-to-tl p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="sm"
              tooltip={!isExpanded ? 'Follow us on X' : undefined}
              className="group h-10"
            >
              <a
                href="https://x.com/<app_twitter_handle>"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                {isExpanded && (
                  <span className="font-medium">Follow us on X</span>
                )}
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem className="mt-auto">
            <div className={cn('flex', !isExpanded && 'justify-center')}>
              <ThemeSwitcher variant={isExpanded ? 'full' : 'icon'} />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
