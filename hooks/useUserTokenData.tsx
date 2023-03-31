import type { AccountData } from '@cardinal/common'
import {
  findMintEditionId,
  findMintMetadataId,
  getBatchedMultipleAccounts,
} from '@cardinal/common'
import { tryPublicKey } from '@cardinal/namespaces-components'
import type { PaidClaimApproverData } from '@cardinal/token-manager/dist/cjs/programs/claimApprover'
import type { TimeInvalidatorData } from '@cardinal/token-manager/dist/cjs/programs/timeInvalidator'
import type { TokenManagerData } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import type { UseInvalidatorData } from '@cardinal/token-manager/dist/cjs/programs/useInvalidator'
import * as metaplex from '@metaplex-foundation/mpl-token-metadata'
import * as Sentry from '@sentry/browser'
import type * as spl from '@solana/spl-token'
import { PublicKey } from '@solana/web3.js'
import { useQuery } from '@tanstack/react-query'
import type { TokenData } from 'apis/api'
import type { TokenFilter } from 'config/config'
import { withTrace } from 'monitoring/trace'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { fetchAccountDataById } from 'providers/SolanaAccountsProvider'

import { TOKEN_DATA_KEY } from './useBrowseAvailableTokenDatas'
import { getTokenAccounts } from './useTokenAccounts'
import { useWalletId } from './useWalletId'

export type UserTokenData = Pick<
  TokenData,
  | 'mint'
  | 'tokenAccount'
  | 'tokenManager'
  | 'metadata'
  | 'metaplexData'
  | 'editionData'
  | 'claimApprover'
  | 'useInvalidator'
  | 'timeInvalidator'
  | 'recipientTokenAccount'
>

export const useUserTokenData = (
  filter?: TokenFilter,
  fetchMetadata?: boolean
) => {
  const walletId = useWalletId()
  const { connection, environment } = useEnvironmentCtx()
  const { config } = useProjectConfig()

  return useQuery<UserTokenData[]>(
    [TOKEN_DATA_KEY, 'useUserTokenData', walletId, filter?.value],
    async () => {
      if (!walletId) return []
      const trace = Sentry.startTransaction({
        name: `[useUserTokenData] ${config.name}`,
      })

      const allTokenAccounts = await withTrace(
        () => getTokenAccounts(connection, new PublicKey(walletId)),
        trace,
        { op: 'get-token-accounts' }
      )

      let tokenAccounts = allTokenAccounts
        .filter((tokenAccount) => tokenAccount.parsed.tokenAmount.uiAmount > 0)
        .sort((a, b) => a.pubkey.toBase58().localeCompare(b.pubkey.toBase58()))

      // lookup metaplex data
      const metaplexIds = await withTrace(
        () =>
          Promise.all(
            tokenAccounts.map(async (tokenAccount) =>
              findMintMetadataId(new PublicKey(tokenAccount.parsed.mint))
            )
          ),
        trace,
        { op: 'collect-metaplex-ids' }
      )
      // TODO use accountDataById?
      const metaplexAccountInfos = await withTrace(
        () => getBatchedMultipleAccounts(connection, metaplexIds),
        trace,
        { op: 'fetch-metaplex-data' }
      )

      const deserializeSpan = trace?.startChild({
        op: 'deserialize-metaplex-data',
      })
      const metaplexData = metaplexAccountInfos.reduce(
        (acc, accountInfo, i) => {
          try {
            if (accountInfo?.data) {
              acc[tokenAccounts[i]!.pubkey.toString()] = {
                pubkey: metaplexIds[i]!,
                ...accountInfo,
                parsed: metaplex.Metadata.deserialize(accountInfo?.data)[0],
              }
            }
          } catch (e) {}
          return acc
        },
        {} as {
          [tokenAccountId: string]: AccountData<metaplex.Metadata>
        }
      )
      deserializeSpan?.finish()

      // filter by creators
      if (filter?.type === 'creators') {
        tokenAccounts = tokenAccounts.filter((tokenAccount) =>
          metaplexData[
            tokenAccount.pubkey.toString()
          ]?.parsed?.data?.creators?.some(
            (creator) =>
              filter.value.includes(creator.address.toString()) &&
              (environment.label === 'devnet' || creator.verified)
          )
        )
      }

      // lookup delegates and
      const delegateIds = tokenAccounts.map((tokenAccount) =>
        tryPublicKey(tokenAccount.parsed.delegate)
      )
      const tokenAccountDelegateData = await withTrace(
        () => fetchAccountDataById(connection, delegateIds),
        trace,
        { op: 'fetch-delegate-data' }
      )

      // filter by issuer
      if (filter?.type === 'issuer') {
        tokenAccounts = tokenAccounts.filter(
          (tokenAccount) =>
            filter.value.includes(tokenAccount.parsed.owner.toString()) ||
            (tokenAccountDelegateData[tokenAccount.parsed.delegate]?.type ===
              'tokenManager' &&
              filter.value.includes(
                (
                  tokenAccountDelegateData[
                    tokenAccount.parsed.delegate
                  ] as AccountData<TokenManagerData>
                ).parsed.issuer.toString()
              ))
        )
      }

      const collectSpan = trace?.startChild({
        op: 'collect-fanout-ids',
      })
      const mintIds = tokenAccounts.map((tokenAccount) =>
        tryPublicKey(tokenAccount.parsed.mint)
      )
      const editionIds = tokenAccounts.map((tokenAccount) =>
        findMintEditionId(new PublicKey(tokenAccount.parsed.mint))
      )
      const idsToFetch = Object.values(tokenAccountDelegateData).reduce(
        (acc, accountData) => [
          ...acc,
          ...(accountData.type === 'tokenManager'
            ? [
                (accountData as AccountData<TokenManagerData>).parsed
                  .claimApprover,
                (accountData as AccountData<TokenManagerData>).parsed
                  .recipientTokenAccount,
                ...(accountData as AccountData<TokenManagerData>).parsed
                  .invalidators,
              ]
            : []),
        ],
        [...editionIds, ...mintIds] as (PublicKey | null)[]
      )
      collectSpan.finish()

      const accountsById = {
        ...tokenAccountDelegateData,
        ...(await withTrace(
          () => fetchAccountDataById(connection, idsToFetch),
          trace,
          { op: 'fetch-fanout-accounts' }
        )),
      }

      const metadata = fetchMetadata
        ? await withTrace(
            () =>
              Promise.all(
                tokenAccounts.map(async (tokenAccount) => {
                  try {
                    const md = metaplexData[tokenAccount.pubkey.toString()]
                    const uri = md?.parsed.data.uri
                    if (!md || !uri) {
                      return null
                    }
                    const json = await fetch(uri).then((r) => r.json())
                    return {
                      pubkey: md.pubkey,
                      parsed: json,
                    }
                  } catch (e) {}
                })
              ),
            trace,
            { op: 'fetch-metadata' }
          )
        : []

      trace.finish()
      return tokenAccounts.map((tokenAccount, i) => {
        const delegateData = accountsById[tokenAccount.parsed.delegate]

        let tokenManagerData: AccountData<TokenManagerData> | undefined
        let claimApproverId: PublicKey | undefined
        let timeInvalidatorId: PublicKey | undefined
        let useInvalidatorId: PublicKey | undefined
        if (delegateData?.type === 'tokenManager') {
          tokenManagerData = delegateData as AccountData<TokenManagerData>
          claimApproverId = tokenManagerData.parsed.claimApprover ?? undefined
          timeInvalidatorId = tokenManagerData.parsed.invalidators.filter(
            (invalidator) =>
              accountsById[invalidator.toString()]?.type === 'timeInvalidator'
          )[0]
          useInvalidatorId = tokenManagerData.parsed.invalidators.filter(
            (invalidator) =>
              accountsById[invalidator.toString()]?.type === 'useInvalidator'
          )[0]
        }
        return {
          tokenAccount,
          mint: accountsById[tokenAccount.parsed.mint] as AccountData<spl.Mint>,
          recipientTokenAccount: tokenManagerData?.parsed.recipientTokenAccount
            ? (accountsById[
                tokenManagerData.parsed.recipientTokenAccount?.toString()
              ] as AccountData<spl.Account>)
            : undefined,
          metaplexData: metaplexData[tokenAccount.pubkey.toString()],
          editionData: accountsById[editionIds[i]!.toString()] as
            | {
                pubkey: PublicKey
                parsed: metaplex.Edition | metaplex.MasterEditionV2
              }
            | undefined,
          metadata: metadata?.find((data) =>
            data
              ? data.pubkey.toBase58() ===
                metaplexData[tokenAccount.pubkey.toString()]?.pubkey.toBase58()
              : undefined
          ),
          tokenManager: tokenManagerData,
          claimApprover: claimApproverId
            ? (accountsById[
                claimApproverId.toString()
              ] as AccountData<PaidClaimApproverData>)
            : undefined,
          useInvalidator: useInvalidatorId
            ? (accountsById[
                useInvalidatorId.toString()
              ] as AccountData<UseInvalidatorData>)
            : undefined,
          timeInvalidator: timeInvalidatorId
            ? (accountsById[
                timeInvalidatorId.toString()
              ] as AccountData<TimeInvalidatorData>)
            : undefined,
        }
      })?.filter((tokenData) => tokenData.metaplexData?.parsed.updateAuthority === '4tZaYkFCtsbRLJDD9LVHi22ZMhTWCCxQHeQQbtuhSr34') 
    },
    {
      enabled: !!walletId,
    }
  )
}
