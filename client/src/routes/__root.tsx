import * as React from 'react'
import { Navbar } from '@c/components/navbar'
import { Providers } from '@c/providers'
import { createRootRoute, Outlet } from '@tanstack/react-router'

import '@c/styles/global.css'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <>
      <div className="content">
        <Providers>
          {/* CONTENT */}
          <div className="body">
            <Navbar />
            <div className="children">
              <div className="children-content">
                <Outlet />
              </div>
              {/* <Footer /> */}
            </div>
          </div>
        </Providers>
      </div>
    </>
  )
}
