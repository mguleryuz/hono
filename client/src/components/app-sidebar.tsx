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
import { Home, Sparkles } from 'lucide-react'

import { ThemeSwitcher } from './theme-switcher'

export function AppSidebar() {
  const location = useLocation()
  const pathname = location.pathname
  const { open, isMobile, openMobile } = useSidebar()

  // On mobile, use openMobile state; on desktop, use open state
  const isExpanded = isMobile ? openMobile : open

  return (
    <Sidebar collapsible="icon" className="sidebar-backdrop border-r">
      <SidebarHeader className="border-border/50 border-b bg-transparent">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              tooltip={!isExpanded ? '<app_title>' : undefined}
            >
              <Link
                to="/"
                className={cn(
                  'group flex items-center gap-3 px-2 py-3',
                  !isExpanded && 'justify-center px-0'
                )}
              >
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[hsl(165,82%,51%)] to-[hsl(280,68%,60%)] opacity-60 blur-lg" />
                  <img
                    src="/images/icon.svg"
                    alt="App Logo"
                    className="relative z-10 size-10 object-contain invert-0 dark:invert"
                  />
                </div>
                {isExpanded && (
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="bg-gradient-to-r from-[hsl(165,82%,51%)] via-[hsl(280,68%,60%)] to-[hsl(142,71%,45%)] bg-clip-text text-lg font-bold text-transparent">
                      {'<app_title>'}
                    </span>
                    <span className="text-muted-foreground flex items-center gap-1 text-xs">
                      <Sparkles className="size-3 text-[hsl(45,93%,47%)]" />
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
          <div className="flex-1">
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/'}
                tooltip="Home"
                className="group relative h-12 overflow-hidden data-[active=true]:bg-gradient-to-r data-[active=true]:from-[hsl(165,82%,51%)]/10 data-[active=true]:to-[hsl(280,68%,60%)]/10"
              >
                <Link to="/">
                  <div className="absolute inset-0 bg-gradient-to-r from-[hsl(165,82%,51%)]/0 to-[hsl(280,68%,60%)]/0 transition-all" />
                  <Home className="relative z-10 size-5" />
                  <span className="relative z-10 font-medium">Home</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </div>

          <SidebarMenuItem className="mt-auto">
            <div className={cn('flex', !isExpanded && 'justify-center')}>
              <ThemeSwitcher variant={isExpanded ? 'full' : 'icon'} />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-border/50 border-t bg-gradient-to-t from-[hsl(280,68%,60%)]/10 to-transparent p-2">
        <SidebarMenu>{/* TODO: Add footer items */}</SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
