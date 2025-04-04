'use client'

import { createContext, useContext } from 'react'

export type TAppContext = {}

const AppContext = createContext({} as TAppContext)

export function AppProvider({ children }: { children: React.ReactNode }) {
  // CONTEXT
  //==============================================
  const contextData: TAppContext = {}

  // RETURN
  //==============================================
  return (
    <AppContext.Provider value={contextData}>{children}</AppContext.Provider>
  )
}

export const useAppContext = () => useContext(AppContext)
