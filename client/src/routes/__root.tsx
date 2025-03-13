import * as React from 'react'
import { Outlet, createRootRoute } from '@tanstack/react-router'
import { Providers } from '@c/providers'
import { Navbar } from '@c/components/navbar'

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
