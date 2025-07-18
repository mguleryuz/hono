import type {
  Account,
  Chain,
  HttpTransport,
  PublicClient,
  Transport,
  WalletClient,
} from 'viem'
import { createPublicClient, createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import * as internalChains from 'viem/chains'

import { getAdminPrivateKey } from './env'

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

export const chains = [internalChains.optimismSepolia] as [Chain, ...Chain[]]

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

const clientCache = new Map<number, PublicClient<Transport, Chain>>()

/**
 * Get a public client for a specific chain
 */
export const getPublicClient = async (
  chainId: number
): Promise<PublicClient<Transport, Chain>> => {
  const cachedClient = clientCache.get(chainId)
  if (cachedClient) return cachedClient

  const chain = getChainById(chainId)

  if (!chain) throw new Error(`Chain with ID ${chainId} not found`)

  const publicClient = createPublicClient({
    chain,
    transport: getERPCTransport(chainId),
    cacheTime: 10000, // 10 seconds
  }) as PublicClient<Transport, Chain>

  clientCache.set(chainId, publicClient)

  return publicClient
}

const walletClientCache = new Map<
  number,
  WalletClient<Transport, Chain, Account>
>()

export const getWalletClient = async (
  chainId: number
): Promise<WalletClient<Transport, Chain, Account>> => {
  const PRIVATE_KEY = getAdminPrivateKey()
  if (!PRIVATE_KEY) throw new Error('Admin private key not configured')

  const cachedClient = walletClientCache.get(chainId)
  if (cachedClient) return cachedClient

  const account = privateKeyToAccount(PRIVATE_KEY)
  const publicClient = await getPublicClient(chainId)

  const walletClient = createWalletClient({
    account,
    chain: publicClient.chain,
    transport: getERPCTransport(chainId),
  })

  walletClientCache.set(chainId, walletClient)

  return walletClient
}
