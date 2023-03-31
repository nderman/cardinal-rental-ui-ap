import { shortPubKey } from '@cardinal/common'
import {
  useAddressImage,
  useAddressName,
} from '@cardinal/namespaces-components'
import { TokenManagerState } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import { css } from '@emotion/react'
import { useQuery } from '@tanstack/react-query'
import type { TokenData } from 'apis/api'
import { GlyphLargeClose } from 'assets/GlyphLargeClose'
import { SolanaLogo } from 'assets/SolanaLogo'
import { ButtonSmall } from 'common/ButtonSmall'
import { Card } from 'common/Card'
import { HeaderSlim } from 'common/HeaderSlim'
import { NFT } from 'common/NFT'
import { NFTHeader } from 'common/NFTHeader'
import { NFTIssuerInfo } from 'common/NFTIssuerInfo'
import { NFTViewRental } from 'common/NFTViewRental'
import { notify } from 'common/Notification'
import { RefreshButton } from 'common/RefreshButton'
import { SelecterDrawer } from 'common/SelectedDrawer'
import { TabSelector } from 'common/TabSelector'
import { elligibleForRent, getMintfromTokenData } from 'common/tokenDataUtils'
import type { ProjectConfig } from 'config/config'
import { projectConfigs } from 'config/config'
import { useClaimEventsForConfig } from 'hooks/useClaimEventsForConfig'
import { useManagedTokens } from 'hooks/useManagedTokens'
import { useUserRegion } from 'hooks/useUserRegion'
import { useUserTokenData } from 'hooks/useUserTokenData'
import { useWalletId } from 'hooks/useWalletId'
import { logConfigEvent } from 'monitoring/amplitude'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { filterTokens, useProjectConfig } from 'providers/ProjectConfigProvider'
import { useEffect, useState } from 'react'
import { HiUserCircle } from 'react-icons/hi'

import { Activity } from './Activity'
import type { PANE_OPTIONS } from './Browse'
import { PANE_TABS } from './Browse'
import DisallowedRegion from './DisallowedRegion'
import type { ManageTokenGroupId } from './Manage'
import { manageTokenGroups } from './Manage'
import { isSelected } from './TokenQueryResults'

export const groupByConfig = (
  tokenDatas: TokenData[],
  configs: ProjectConfig[],
  cluster?: string
) => {
  const groups = tokenDatas.reduce(
    (acc, tokenData) => {
      let isPlaced = false
      return acc.map((section) => {
        const filteredToken = !isPlaced
          ? filterTokens([tokenData], section.config.filter, cluster)
          : []
        if (filteredToken.length > 0 && !isPlaced) {
          isPlaced = true
          return {
            ...section,
            tokenDatas: [...(section.tokenDatas ?? []), tokenData],
          }
        }
        return section
      })
    },
    configs.map(
      (c) =>
        ({ config: c, tokenDatas: [], showEmpty: false } as {
          config: ProjectConfig
          showEmpty: boolean
          tokenDatas: TokenData[]
        })
    )
  )
  return groups.filter(
    ({ tokenDatas, showEmpty }) => tokenDatas.length !== 0 || showEmpty
  )
}

export const tokenDatasId = (
  tokenDatas:
    | (
        | Pick<TokenData, 'tokenManager'>
        | Pick<TokenData, 'metaplexData'>
        | Pick<TokenData, 'indexedData'>
      )[]
    | undefined
) => tokenDatas?.map((tokenData) => getMintfromTokenData(tokenData)).join(',')

export const Dashboard = () => {
  const walletId = useWalletId()
  const userRegion = useUserRegion()
  const { secondaryConnection, environment } = useEnvironmentCtx()
  const { config, setProjectConfig } = useProjectConfig()

  const [selectedTokens, setSelectedTokens] = useState<TokenData[]>([])
  const [selectedGroup, setSelectedGroup] = useState<ManageTokenGroupId>('all')
  const [selectedConfig, setSelectedConfig] = useState<
    ProjectConfig | undefined
  >(undefined)
  const [pane, setPane] = useState<PANE_OPTIONS>('browse')

  const claimEvents = useClaimEventsForConfig(true, walletId)
  const userTokenDatas = useUserTokenData(config.filter)
  const { data: addressImage, isFetching: loadingImage } = useAddressImage(
    secondaryConnection,
    walletId
  )
  const { data: displayName, isFetching: loadingName } = useAddressName(
    secondaryConnection,
    walletId
  )
  const managedTokens = useManagedTokens(selectedConfig)
  // const allManagedTokens = useQuery(
  //   [
  //     'useAllManagedTokens',
  //     walletId?.toString(),
  //     tokenDatasId(userTokenDatas.data),
  //     tokenDatasId(managedTokens.data),
  //   ],
  //   () => {
  //     return [
  //       ...(userTokenDatas.data ?? []),
  //       ...(managedTokens.data?.filter(
  //         (tokenData) =>
  //           !userTokenDatas.data
  //             ?.map(
  //               (userTokenData) => getMintfromTokenData(userTokenData) ?? ''
  //             )
  //             .includes(getMintfromTokenData(tokenData) ?? '')
  //       ) ?? []),
  //     ]
  //   },
  //   {
  //     enabled: userTokenDatas.isFetched && managedTokens.isFetched,
  //   }
  // )
  const availableTokens = useQuery(
    [
      'availableTokens',
      walletId?.toString(),
      tokenDatasId(userTokenDatas.data),
    ],
    () => {
      return (userTokenDatas.data ?? []).filter((tokenData) =>
        elligibleForRent(config, tokenData)
      )
    },
    {
      enabled: userTokenDatas.isFetched,
    }
  )

  const rentedTokens = useQuery(
    [
      'useRentedTokens',
      walletId?.toString(),
      tokenDatasId(userTokenDatas.data),
    ],
    () => {
      return (userTokenDatas.data ?? []).filter((tokenData) => {
        return !!tokenData.tokenManager
      })
    },
    {
      enabled: userTokenDatas.isFetched,
    }
  )

  const tokenQuery = {
    all: availableTokens,
    available: availableTokens,
    rented: rentedTokens,
    'rented-out': managedTokens,
  }[selectedGroup]
  const groupedTokens = groupByConfig(
    tokenQuery.data ?? [],
    selectedConfig
      ? [selectedConfig]
      : Object.values(projectConfigs).filter((c) => c.type === 'Collection')
  )

  useEffect(() => {
    setProjectConfig('default')
  }, [])

  if (!userRegion.isFetched) {
    return <></>
  }

  if (!userRegion.data?.isAllowed && !process.env.BYPASS_REGION_CHECK) {
    return <DisallowedRegion />
  }

  return (
    <>
      <SelecterDrawer
        selectedTokens={selectedTokens}
        onClose={() => setSelectedTokens([])}
      />
      <HeaderSlim hideDashboard />
      <div className="relative flex w-full flex-wrap items-center justify-center gap-16 py-8 px-4 md:justify-between md:px-10">
        <div className="flex items-center gap-4">
          <div
            className={`flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-border ${
              loadingImage && 'animate-pulse bg-border'
            }`}
          >
            {addressImage ? (
              <img
                className="w-full"
                src={addressImage[0]}
                alt={displayName ? displayName[0] : addressImage[0]}
              />
            ) : (
              !loadingImage && (
                <HiUserCircle className="relative h-full w-full scale-[1.25]" />
              )
            )}
          </div>
          {loadingName ? (
            <div className="flex flex-col gap-2">
              <div className="h-8 w-48 animate-pulse rounded-xl bg-border"></div>
              <div className="h-6 w-32 animate-pulse rounded-xl bg-border"></div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="text-2xl text-light-0">
                {displayName ? displayName[0] : shortPubKey(walletId)}
              </div>
              <div className="flex items-center gap-2 text-lg text-medium-3">
                <SolanaLogo height={16} />
                <div>{shortPubKey(walletId)}</div>
              </div>
            </div>
          )}
        </div>
        <div className={`flex flex-wrap gap-y-5`}>
          <div className="flex items-center justify-center gap-4">
            <p className="text-lg text-medium-4">Owned</p>
            {!availableTokens.isFetched ? (
              <div className="h-5 w-10 animate-pulse rounded-md bg-border"></div>
            ) : (
              <div className="text-center text-xl text-light-1">
                {availableTokens.data?.length}
              </div>
            )}
          </div>
          <div className="mx-4 my-auto h-10 w-[1px] bg-border lg:mx-6"></div>
          <div className="flex items-center justify-center gap-4">
            <p className="text-lg text-medium-4">Listed</p>
            {!rentedTokens.isFetched ? (
              <div className="h-5 w-10 animate-pulse rounded-md bg-border"></div>
            ) : (
              <div className="text-center text-xl text-light-1">
                {rentedTokens.data?.length}
              </div>
            )}
          </div>
        </div>
      </div>
      <>
        <SelecterDrawer
          selectedTokens={selectedTokens}
          onClose={() => setSelectedTokens([])}
        />
        <div className="mx-10 mt-4 flex flex-wrap justify-between gap-4">
          <div className="flex flex-wrap gap-4">
            <TabSelector<ManageTokenGroupId>
              defaultOption={{
                value: 'available',
                label: manageTokenGroups(walletId).find(
                  (g) => g.id === selectedGroup
                )?.header,
              }}
              options={manageTokenGroups(walletId)
                .filter((v) => v.id !== 'all')
                .map((g) => ({
                  label: g.header,
                  value: g.id,
                }))}
              onChange={(o) => {
                logConfigEvent('dashboard: click tab', config, {
                  name: o.value,
                })
                setSelectedTokens([])
                setSelectedGroup(o.value)
                setPane('browse')
              }}
            />
          </div>
          <div className="flex gap-4">
            <RefreshButton
              colorized
              isFetching={
                pane === 'browse'
                  ? userTokenDatas.isFetching || managedTokens.isFetching
                  : claimEvents.isFetching
              }
              dataUpdatdAtMs={
                pane === 'browse'
                  ? Math.min(
                      tokenQuery.dataUpdatedAt,
                      managedTokens.dataUpdatedAt
                    )
                  : claimEvents.dataUpdatedAt
              }
              handleClick={() => {
                if (pane === 'browse') {
                  userTokenDatas.refetch()
                  managedTokens.refetch()
                } else {
                  claimEvents.refetch()
                }
              }}
            />
            <TabSelector
              defaultOption={PANE_TABS[0]}
              options={PANE_TABS}
              onChange={(o) => {
                logConfigEvent('dashboard: set pane', config, {
                  pane_value: o?.label,
                })
                setPane(o.value)
              }}
            />
          </div>
        </div>
        {
          {
            activity: <Activity user={walletId} />,
            browse:
              tokenQuery.isFetched && groupedTokens.length === 0 ? (
                <div className="my-40 flex w-full flex-col items-center justify-center gap-1">
                  <GlyphLargeClose />
                  <div className="mt-4 text-medium-4">
                    No results at this moment...
                  </div>
                  <ButtonSmall onClick={() => tokenQuery.refetch()}>
                    Retry
                  </ButtonSmall>
                </div>
              ) : (
                <div className="mx-auto mt-12 px-10">
                  {!tokenQuery.isFetched ? (
                    <div className="flex flex-wrap justify-center gap-4 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                      <Card skeleton header={<></>} subHeader={<></>} />
                      <Card skeleton header={<></>} subHeader={<></>} />
                      <Card skeleton header={<></>} subHeader={<></>} />
                      <Card skeleton header={<></>} subHeader={<></>} />
                      <Card skeleton header={<></>} subHeader={<></>} />
                      <Card skeleton header={<></>} subHeader={<></>} />
                      <Card skeleton header={<></>} subHeader={<></>} />
                      <Card skeleton header={<></>} subHeader={<></>} />
                    </div>
                  ) : (
                    <div className="flex flex-col gap-12">
                      {groupedTokens.map(({ config, tokenDatas }) => (
                        <div key={config.name} className="flex flex-col gap-6">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl text-light-0">
                              {config.displayName !== 'Unverified' ? (
                                <a
                                  href={`/${config.name}${
                                    environment.label === 'devnet'
                                      ? '?cluster=devnet'
                                      : ''
                                  }`}
                                >
                                  {config.displayName}
                                </a>
                              ) : (
                                config.displayName
                              )}
                            </div>
                            <div className="text-xl">{tokenDatas.length}</div>
                          </div>
                          <div className="flex flex-wrap justify-center gap-4 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                            {tokenDatas.map((tokenData) => (
                              <Card
                                key={`${tokenData.tokenManager?.pubkey.toString()}-${tokenData.tokenAccount?.pubkey.toString()}`}
                                className={`cursor-pointer ${
                                  isSelected(tokenData, selectedTokens)
                                    ? 'border-[1px] border-secondary'
                                    : ''
                                }`}
                                css={css`
                                  box-shadow: ${isSelected(
                                    tokenData,
                                    selectedTokens
                                  )
                                    ? `0px 0px 30px ${config.colors.accent}`
                                    : ''};
                                `}
                                onClick={() => {
                                  if (isSelected(tokenData, selectedTokens)) {
                                    setSelectedTokens(
                                      selectedTokens.filter(
                                        (t) =>
                                          t.tokenAccount?.parsed.mint.toString() !==
                                          tokenData.tokenAccount?.parsed.mint.toString()
                                      )
                                    )
                                  } else if (
                                    elligibleForRent(config, tokenData)
                                  ) {
                                    setSelectedTokens([
                                      ...selectedTokens,
                                      tokenData,
                                    ])
                                  } else {
                                    notify({
                                      message: 'Not elligible',
                                      description:
                                        'This token is not ellgibile for rent!',
                                    })
                                  }
                                }}
                                hero={
                                  <NFT
                                    tokenData={tokenData}
                                    displayInvalidationInfo={
                                      tokenData.tokenManager?.parsed.issuer.toString() ===
                                        walletId?.toString() &&
                                      !!tokenData.timeInvalidator
                                    }
                                  />
                                }
                                header={<NFTHeader tokenData={tokenData} />}
                                content={
                                  tokenData.tokenManager ? (
                                    {
                                      [TokenManagerState.Initialized]: <></>,
                                      [TokenManagerState.Issued]: (
                                        <div className="flex h-full w-full flex-row items-center justify-between text-sm">
                                          <NFTIssuerInfo
                                            tokenData={tokenData}
                                          />
                                        </div>
                                      ),
                                      [TokenManagerState.Claimed]: (
                                        <div className="flex h-full flex-row justify-between text-sm">
                                          <NFTIssuerInfo
                                            tokenData={tokenData}
                                          />
                                          <NFTViewRental
                                            tokenData={tokenData}
                                          />
                                        </div>
                                      ),
                                      [TokenManagerState.Invalidated]: <></>,
                                    }[
                                      tokenData?.tokenManager?.parsed
                                        .state as TokenManagerState
                                    ]
                                  ) : elligibleForRent(config, tokenData) ? (
                                    <div className="flex h-full items-end justify-end">
                                      <ButtonSmall
                                        disabled={!walletId}
                                        className="inline-block flex-none px-4 py-2 text-lg"
                                        onClick={async () => {
                                          console.log('click')
                                          if (
                                            elligibleForRent(config, tokenData)
                                          ) {
                                            setSelectedTokens([
                                              ...selectedTokens,
                                              tokenData,
                                            ])
                                          } else {
                                            notify({
                                              message: 'Not elligible',
                                              description:
                                                'This token is not ellgibile for rent!',
                                            })
                                          }
                                        }}
                                      >
                                        Select
                                      </ButtonSmall>
                                    </div>
                                  ) : (
                                    <></>
                                  )
                                }
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ),
          }[pane]
        }
      </>
    </>
  )
}
