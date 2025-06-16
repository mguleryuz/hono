'use client'

import * as React from 'react'
import { getAuthMethod } from '@/utils/env'
import { useAuthEvm, useChainSpecs } from '@c/hooks'
import { cn } from '@c/utils'
import { useAccountModal, useConnectModal } from '@rainbow-me/rainbowkit'
import { CircleAlert, Pointer, Wallet } from 'lucide-react'

import { Button } from './ui/button'
import type { ButtonProps } from './ui/button'

const authMethod = getAuthMethod()
const isEvmAuth = authMethod === 'evm'

const compressAddress = (address?: string) => {
  if (!address) return '...'
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export interface WalletWidgetProps extends ButtonProps {
  text?: string
  applyClassToLoading?: boolean
}

export function WalletWidget(props: WalletWidgetProps) {
  const { size, className, text, applyClassToLoading = true, ...rest } = props

  const { isConnected, address, iconSrc, isUnsupportedChain } = useChainSpecs()

  const { openConnectModal } = useConnectModal()
  const { openAccountModal } = useAccountModal()

  const auth = useAuthEvm()

  const setShowWalletWidget = () =>
    !isConnected || (isEvmAuth && auth.data.status !== 'authenticated')
      ? openConnectModal?.()
      : openAccountModal?.()

  if (isConnected && !address)
    return (
      <Button
        loader={props.loader}
        loading
        className={cn(applyClassToLoading && className)}
      />
    )

  const getStartIcon = () => {
    if ('startIcon' in props) return props.startIcon
    if (!isConnected) return <Wallet size={20} />

    if (!!iconSrc)
      return (
        <img
          src={iconSrc}
          alt="icon"
          width={20}
          height={20}
          className="in--max-h-full in--rounded-full"
        />
      )

    if (text === undefined && isUnsupportedChain)
      return <CircleAlert size={20} fill="red" />

    return null
  }

  const getEndIcon = () => {
    if ('endIcon' in props) return props.endIcon
    if (!!isConnected && !!text) return <Pointer size={20} />

    return null
  }

  const getChildren = () => {
    if (!isConnected) return 'Connect Wallet'
    if (!!text) return text

    return compressAddress(address)
  }

  const color = (() => {
    if ('color' in props) return props.color
    if (!isConnected || !!text || isUnsupportedChain) return 'primary'
    return ''
  })()

  const variant = (() => {
    if ('variant' in props) return props.variant
    if (isConnected) return 'outline'
    return 'default'
  })()

  return (
    <Button
      color={color}
      variant={variant}
      startIcon={getStartIcon()}
      endIcon={getEndIcon()}
      className={cn(className, 'in--leading-[unset]')}
      type={props.type ?? 'button'}
      size={size ?? 'sm'}
      onClick={setShowWalletWidget}
      {...rest}
    >
      {getChildren()}
    </Button>
  )
}
