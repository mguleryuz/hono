import { createPublicClient, http, type PublicClient } from 'viem'
import { sepolia, polygon } from 'viem/chains'
import { getDrpcApiKey } from './env'

// DRPC API configuration
const drpcApiKey = getDrpcApiKey()

// Supported blockchain networks
export const chains = [polygon, sepolia] as const

// Mapping of chain IDs to DRPC network identifiers
export const drpcChainIdMap = {
  1: 'ethereum',
  11155111: 'sepolia',
  10: 'optimism',
  11155420: 'optimism-sepolia',
  84532: 'base-sepolia',
  1101: 'polygon-zkevm',
  2442: 'polygon-zkevm-cardona',
} as Record<number, string | undefined>

/**
 * Creates an HTTP transport for a specific chain
 * Falls back to default HTTP transport if DRPC is not configured
 */
export const getDrpcTransport = (chainId: number) => {
  const chainIdMap = drpcChainIdMap?.[chainId]
  if (!drpcApiKey || !chainIdMap) return http()
  return http(
    `https://lb.drpc.org/ogrpc?network=${chainIdMap}&dkey=${drpcApiKey}`
  )
}

const clientCache = new Map<number, PublicClient>()

export const getPublicClient = async (chainId: number) => {
  const cachedClient = clientCache.get(chainId)
  if (cachedClient) return cachedClient

  const chain = chains.find((chain) => chain.id === chainId)

  if (!chain) throw new Error(`Chain with ID ${chainId} not found`)

  const publicClient = createPublicClient({
    chain,
    transport: getDrpcTransport(chainId),
    cacheTime: 5000, // 5 seconds
  })

  clientCache.set(chainId, publicClient)

  return publicClient
}
