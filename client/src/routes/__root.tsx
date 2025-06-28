import { AppSidebar } from '@c/components/app-sidebar'
import { FourOFour } from '@c/components/ui/four-o-four'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@c/components/ui/sidebar'
import { WalletWidget } from '@c/components/wallet-widget'
import { Providers } from '@c/providers'
import { createRootRoute, Outlet } from '@tanstack/react-router'

import '@c/styles/global.css'

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: FourOFour,
})

function RootComponent() {
  return (
    <Providers>
      <SidebarProvider>
        <div className="flex h-screen w-full overflow-hidden">
          <AppSidebar />
          <SidebarInset className="flex flex-1 flex-col overflow-hidden">
            {/* Header with trigger */}
            <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b px-4 backdrop-blur">
              <SidebarTrigger className="-ml-1" />
              <WalletWidget className="ml-auto" />
            </header>

            {/* Main content area */}
            <main className="bg-pattern flex-1 overflow-x-hidden overflow-y-auto">
              <div className="relative z-10 container mx-auto max-w-screen-xl p-6 pb-24 lg:p-8 lg:pb-24">
                <Outlet />
              </div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </Providers>
  )
}
