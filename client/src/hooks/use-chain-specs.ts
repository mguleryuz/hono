'use client'

import * as React from 'react'
import { useAccount, useChains } from 'wagmi'
import { ChainLogo } from '@api3/logos'

export const getIconSrc = (chainId?: number) => {
  const fallback = (ChainLogo('1') as any)?.src || ChainLogo('1')

  if (!chainId) return fallback

  const available =
    (ChainLogo(chainId.toString()) as any)?.src || ChainLogo(chainId.toString())

  if (available) return available

  return fallback
}

export type UseChainSpecsReturnType = ReturnType<typeof useChainSpecs>

export const useChainSpecs = () => {
  const { address, isConnected, chain } = useAccount() // Wagmi's useAccount for wallet address and connection status
  const chains = useChains() // Wagmi's useNetwork for network details

  // The currently connected chainId and corresponding EVM network
  const chainId = chain?.id
  const evmNetwork = chains.find(({ id }) => id === chainId)

  // Icon URL for the current chain
  const iconSrc = getIconSrc(chainId)

  // Determine if the chain is unsupported
  const isUnsupportedChain = !!isConnected && !evmNetwork

  // Show wallet widget based on chain status
  const showWalletWidget = !isConnected || isUnsupportedChain

  // Ref to store the previous chainId
  const prevChainId = React.useRef(chainId)
  const didChainIdChange =
    chainId !== undefined &&
    prevChainId.current !== undefined &&
    prevChainId.current !== chainId

  // Block explorer URL for the current chain
  const explorerUrl = evmNetwork?.blockExplorers?.[0]?.url

  // Update the previous chainId when the chainId changes
  React.useEffect(() => {
    if (didChainIdChange) prevChainId.current = chainId
  }, [chainId])

  return {
    chainId,
    isConnected,
    address: address as `0x${string}` | undefined,
    networkConfigurations: chains, // List of available networks
    iconSrc,
    didChainIdChange,
    showWalletWidget,
    isUnsupportedChain,
    explorerUrl,
    prevChainId: prevChainId.current,
  }
}
