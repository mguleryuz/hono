import type { Chain, HttpTransport, PublicClient } from 'viem'
import { createPublicClient, http } from 'viem'
import * as internalChains from 'viem/chains'

export const chains = [internalChains.sepolia, internalChains.polygon] as const

/**
 * Get a chain by its id
 */
export const getChainById = (chainId: number): Chain => {
  const chain = Object.values(internalChains).find(
    (chain) => chain.id === chainId
  )
  if (!chain) throw new Error('Chain not found')
  return chain
}

/**
 * Get all chain names
 */
export const chainNames = Object.values(internalChains).reduce(
  (acc, chain) => {
    // Only add if we haven't seen this chainId before
    if (!acc.some((item) => item.id === chain.id)) {
      acc.push({
        id: chain.id,
        name: chain.name,
        testnet: chain.testnet,
      })
    }
    return acc
  },
  [] as { id: number; name: string; testnet?: boolean }[]
)

/**
 * Get the name of a chain by its id
 */
export const getChainName = (chainId: number) => {
  return chainNames.find((chain) => chain.id === chainId)?.name
}

/**
 * Creates an HTTP transport for a specific chain
 */
export const getERPCTransport = (chainId: number): HttpTransport => {
  return http(`https://rpc.inverter.network/main/evm/${chainId}`, {
    timeout: 10000,
  })
}

const clientCache = new Map<number, PublicClient>()

/**
 * Get a public client for a specific chain
 */
export const getPublicClient = async (chainId: number) => {
  const cachedClient = clientCache.get(chainId)
  if (cachedClient) return cachedClient

  const chain = chains.find((chain) => chain.id === chainId)

  if (!chain) throw new Error(`Chain with ID ${chainId} not found`)

  const publicClient = createPublicClient({
    chain,
    transport: getERPCTransport(chainId),
    cacheTime: 5000, // 5 seconds
  })

  clientCache.set(chainId, publicClient)

  return publicClient
}
