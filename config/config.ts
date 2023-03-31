import type { TokenData } from 'apis/api'
import type { AirdropMetadata } from 'common/Airdrop'
import type { IconKey } from 'common/Socials'
import { WRAPPED_SOL_MINT } from 'hooks/usePaymentMints'
import type {
  DurationOption,
  RentalCardConfig,
} from 'rental-components/components/RentalIssueCard'

import type { UserTokenData } from '../hooks/useUserTokenData'

export const defaultDisallowedRegions = [
  { code: 'CU' },
  { code: 'IR' },
  { code: 'KP' },
  { code: 'SY' },
]

export const COLORS = {
  primary: '#907EFF',
  accent: '#7EFFE8',
  glow: '#CE81F4',
  'light-0': '#FFFFFF',
  'light-1': '#F5E2FF',
  'light-2': '#B1AFBB',
  'medium-3': '#8D8B9B',
  'medium-4': '#6D6C7C',
  'dark-5': '#0B0B0B',
  'dark-6': '#000000',
}

export type Colors = {
  accent: string
  glow: string
}

export type TokenFilter = {
  type: 'creators' | 'issuer' | 'state' | 'claimer' | 'owner'
  value: string[]
  nonVerified?: boolean
}

export interface TokenSection {
  id: string
  header?: string
  description?: string
  icon?:
    | 'time'
    | 'featured'
    | 'listed'
    | 'rented'
    | 'available'
    | 'info'
    | 'performance'
  filter?: TokenFilter
  tokens?: TokenData[] | UserTokenData[]
  showEmpty?: boolean
}

export type Badge = {
  badgeType: 'recent' | 'trending' | 'expiration'
  position?: 'top-right' | 'top-left' | 'bottom-left' | 'bottom-right'
  content?: JSX.Element | string
}

export type ProjectConfig = {
  type: 'Collection' | 'Guild'
  hidden?: boolean
  indexDisabled?: boolean
  indexMetadataDisabled?: boolean
  issuedOnly?: boolean
  name: string
  displayName: string
  websiteUrl: string
  hero?: string
  description?: string
  hostname?: string
  twitterHandle?: string
  socialLinks?: {
    icon: IconKey
    link: string
  }[]
  disallowedMints?: string[]
  logoImage: string
  logoPadding?: boolean
  colors: Colors
  badges?: Badge[]
  disableListing?: boolean
  filter?: TokenFilter
  subFilters?: { label: string; filter: TokenFilter }[]
  attributeDisplay?: { displayName?: string; attributeName: string }[]
  sections?: TokenSection[]
  allowNonSol?: boolean
  rentalCard: RentalCardConfig
  airdrops?: AirdropMetadata[]
  showUnknownInvalidators?: boolean
  marketplaceRate?: DurationOption
  allowOneByCreators?: {
    address: string
    enforceTwitter: boolean
    preventMultipleClaims: boolean
    disableReturn: boolean
  }[]
}

const defaultRentalCardConfig: RentalCardConfig = {
  invalidators: ['duration', 'expiration', 'manual'],
  invalidationOptions: {
    visibilities: ['public', 'private'],
    durationOptions: ['days', 'weeks'],
    invalidationTypes: ['reissue'],
    paymentMints: [WRAPPED_SOL_MINT],
    showClaimRentalReceipt: false,
    setClaimRentalReceipt: false,
    maxDurationAllowed: {
      displayText: '12 weeks',
      value: 7258000,
    },
  },
}

// test
export const projectConfigs: { [key: string]: ProjectConfig } = {
  // solrarity: {
  //   name: 'solrarity',
  //   displayName: 'SolRarity Rarikeys',
  //   type: 'Collection',
  //   websiteUrl: 'https://solrarity.app/',
  //   logoImage: '/logos/solrarity.png',
  //   logoPadding: true,
  //   hero: '/logos/solrarity-hero.png',
  //   description:
  //     '2,600 unique Rarikeys allowing you to be part of SolRarity journey in the Solana ecosystem. Hold these precious keys to unlock access to premium tools and more...',
  //   colors: {
  //     accent: '#d40e99',
  //     glow: '#d40e99',
  //   },
  //   badges: [{ badgeType: 'trending' }],
  //   twitterHandle: '@NFTNerdsAI',
  //   socialLinks: [
  //     {
  //       icon: 'web',
  //       link: 'https://solrarity.app/',
  //     },
  //     {
  //       icon: 'twitter',
  //       link: 'https://twitter.com/SolRarity_',
  //     },
  //     {
  //       icon: 'discord',
  //       link: 'https://discord.gg/solrarity',
  //     },
  //   ],
  //   filter: {
  //     type: 'creators',
  //     value: [
  //       '53EmnGdMxnmNcaPUE6wJ2NHz6iUVpge4a7RViTdfb8Dq', // rarikeys 1
  //       'GfuaX8U67NBYHv133cvTDekqWy6EmYUrdH7UxPqKRgCL', // rarikeys 2
  //       'BF2rThtdXMSbFBHbHjTVKXndQnJ1k8HALsX2HCL1QvSc', // snipies
  //     ],
  //   },
  //   subFilters: [
  //     {
  //       label: 'Rarikeys',
  //       filter: {
  //         type: 'creators',
  //         value: [
  //           '53EmnGdMxnmNcaPUE6wJ2NHz6iUVpge4a7RViTdfb8Dq',
  //           'GfuaX8U67NBYHv133cvTDekqWy6EmYUrdH7UxPqKRgCL',
  //         ],
  //       },
  //     },
  //     {
  //       label: 'Snipies',
  //       filter: {
  //         type: 'creators',
  //         value: ['BF2rThtdXMSbFBHbHjTVKXndQnJ1k8HALsX2HCL1QvSc'],
  //       },
  //     },
  //   ],
  //   rentalCard: defaultRentalCardConfig,
  // },
  ['alpha-pharaohs']: {
    name: 'alpha-pharaohs',
    displayName: 'Alpha Pharaohs',
    type: 'Collection',
    websiteUrl: 'https://twitter.com/alphapharaohs',
    logoImage: '/logos/alpha-pharaohs2.webp',
    hero: '/logos/alpha-pharaohs-hero2.png',
    description: `5555 Pharaohs tasked with unlocking ultimate power. Enter the Sacred Society & obtain a multitude of utilities: Alpha, TombRaid (Raid2Earn), Knowledge, and much more.`,
    twitterHandle: '@alphapharaohs',
    socialLinks: [
      {
        icon: 'web',
        link: 'https://twitter.com/alphapharaohs',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/alphapharaohs',
      },
      {
        icon: 'discord',
        link: 'https://discord.gg/alphapharaohs',
      },
    ],
    colors: {
      accent: '#EEE',
      glow: '#DCC7FE',
    },
    filter: {
      type: 'creators',
      value: ['DRqsx7jRNqFyvHeTirjwRGQDCsvB2MvbovAfc6fiDKuk', 'GbmnNXwhhrpEHXUEPVFupEejo22mF4umi2vQZDZc4u2H', '2n3NHYX6KvDsgUcsoUPKFaFmCWCDpikoPWjurqHkoE8b', 'AFMYnDWfSNTE1EvZXMPkStUsGECHD2ucsACihraVMeR2'],
    },
    rentalCard: defaultRentalCardConfig,
  },
}
