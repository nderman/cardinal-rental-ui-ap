import type { Cluster } from '@solana/web3.js'
import { Connection } from '@solana/web3.js'
import { useRouter } from 'next/router'
import React, { useContext, useMemo, useState } from 'react'

export interface Environment {
  label: Cluster
  primary: string
  primaryBeta?: string
  secondary?: string
  api?: string
  index?: string
  index2?: string
}

export interface EnvironmentContextValues {
  environment: Environment
  setEnvironment: (newEnvironment: Environment) => void
  connection: Connection
  secondaryConnection: Connection
}

const INDEX_ENABLED = false
const RPC_BETA_THRESHOLD = 0.25

export const ENVIRONMENTS: Environment[] = [
  {
    label: 'mainnet-beta',
    primary: 'https://intensive-hidden-resonance.solana-mainnet.quiknode.pro/78aa2fe623e4c946cfd2a46764e0c81fbe5f1052/',
    primaryBeta:
      process.env.MAINNET_PRIMARY_BETA || 'https://intensive-hidden-resonance.solana-mainnet.quiknode.pro/78aa2fe623e4c946cfd2a46764e0c81fbe5f1052/',
    secondary: process.env.MAINNET_SECONDARY || 'https://intensive-hidden-resonance.solana-mainnet.quiknode.pro/78aa2fe623e4c946cfd2a46764e0c81fbe5f1052/',
    index: INDEX_ENABLED
      ? 'https://prod-holaplex.hasura.app/v1/graphql'
      : undefined,
  },
  {
    label: 'testnet',
    primary: 'https://api.testnet.solana.com',
  },
  {
    label: 'devnet',
    primary: 'https://api.devnet.solana.com',
  },
]

const EnvironmentContext: React.Context<null | EnvironmentContextValues> =
  React.createContext<null | EnvironmentContextValues>(null)

export function EnvironmentProvider({
  children,
  defaultCluster,
}: {
  children: React.ReactChild
  defaultCluster: string
}) {
  const { query } = useRouter()
  const cluster = (query.project || query.host)?.includes('dev')
    ? 'devnet'
    : query.host?.includes('test')
    ? 'testnet'
    : query.cluster || defaultCluster || process.env.BASE_CLUSTER
  const foundEnvironment = ENVIRONMENTS.find((e) => e.label === cluster)
  const [environment, setEnvironment] = useState<Environment>(
    foundEnvironment ?? ENVIRONMENTS[0]!
  )

  useMemo(() => {
    const foundEnvironment = ENVIRONMENTS.find((e) => e.label === cluster)
    setEnvironment(foundEnvironment ?? ENVIRONMENTS[0]!)
  }, [cluster])

  const connection = useMemo(() => {
    setEnvironment((e) => ({
      ...e,
      primary:
        Math.random() < RPC_BETA_THRESHOLD
          ? environment.primaryBeta ?? environment.primary
          : environment.primary,
    }))
    return new Connection(
      Math.random() < RPC_BETA_THRESHOLD
        ? environment.primaryBeta ?? environment.primary
        : environment.primary,
      { commitment: 'recent' }
    )
  }, [environment.label])

  const secondaryConnection = useMemo(
    () =>
      new Connection(environment.secondary ?? environment.primary, {
        commitment: 'recent',
      }),
    [environment.label]
  )

  return (
    <EnvironmentContext.Provider
      value={{
        environment: {
          ...environment,
          index:
            INDEX_ENABLED || query.index
              ? 'https://graph.holaplex.tools/v1/graphql'
              : undefined,
          index2: `https://welcome-elk-85.hasura.app/v1/graphql`,
        },
        setEnvironment,
        connection,
        secondaryConnection,
      }}
    >
      {children}
    </EnvironmentContext.Provider>
  )
}

export function useEnvironmentCtx(): EnvironmentContextValues {
  const context = useContext(EnvironmentContext)
  if (!context) {
    throw new Error('Missing connection context')
  }
  return context
}
