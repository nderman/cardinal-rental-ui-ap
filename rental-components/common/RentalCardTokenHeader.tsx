import type { TokenData } from 'apis/api'
import { Pill } from 'common/Pill'
import {
  getNameFromTokenData,
  rentalType,
  rentalTypeColor,
  rentalTypeName,
} from 'common/tokenDataUtils'
import { Tooltip } from 'common/Tooltip'
import type { ProjectConfig } from 'config/config'
import { useMintMetadata, useMintMetadatas } from 'hooks/useMintMetadata'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { BsFillInfoCircleFill } from 'react-icons/bs'

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  config: ProjectConfig
  tokenDatas: TokenData[]
}

export const RentalCardTokenHeader: React.FC<Props> = ({
  config,
  tokenDatas,
}: Props) => {
  const mintMetadatas = useMintMetadatas(tokenDatas)
  return (
    <>
      <div className="text-center text-2xl text-light-0">
        Rent out{' '}
        {tokenDatas.length > 1
          ? `(${tokenDatas.length})`
          : tokenDatas[0]
          ? getNameFromTokenData(tokenDatas[0], `(1)`)
          : ''}
      </div>
      <div className="mb-2 text-center text-lg text-medium-4">
        {config.displayName}
      </div>
      <div
        className={
          `flex w-full gap-4 overflow-scroll overflow-x-auto py-4 ` +
          (tokenDatas.length <= 2 ? 'justify-center' : '')
        }
      >
        {mintMetadatas.map((mintMetadata, i) => (
          <div
            key={i}
            className="w-1/2 flex-shrink-0 overflow-hidden rounded-lg bg-medium-4"
          >
            {mintMetadata && mintMetadata.data && (
              <img
                className={`w-full`}
                src={mintMetadata.data.parsed.image}
                alt={getNameFromTokenData(tokenDatas[i]!)}
              />
            )}
          </div>
        ))}
      </div>
    </>
  )
}

interface RentalClaimCardProps extends React.HTMLAttributes<HTMLDivElement> {
  tokenData: TokenData
}

export const RentalClaimCardTokenHeader: React.FC<RentalClaimCardProps> = ({
  tokenData,
}: RentalClaimCardProps) => {
  const type = rentalType(tokenData)
  const { configFromToken } = useProjectConfig()
  const config = configFromToken(tokenData)
  const mintMetadata = useMintMetadata(tokenData)
  return (
    <>
      <div className="text-center text-2xl text-light-0">
        Rent {getNameFromTokenData(tokenData)}
      </div>
      <div className="mb-2 text-center text-lg text-medium-4">
        {config.displayName}
      </div>
      <div
        className={`mb-4 flex w-full justify-center gap-4 overflow-x-auto pb-6`}
      >
        <div className="relative w-3/4 lg:w-1/2">
          {mintMetadata.data && mintMetadata.data.parsed && (
            <img
              className="rounded-lg"
              src={mintMetadata.data.parsed.image}
              alt={getNameFromTokenData(tokenData)}
            />
          )}
          <Tooltip
            className={`absolute top-3 right-3 z-20 rounded-md`}
            title={
              <div>
                {mintMetadata?.data?.parsed.attributes?.map((attr, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between gap-1 rounded-md py-[2px] text-sm text-light-0`}
                  >
                    <div className="font-bold">{attr.trait_type}</div>
                    <div className="text-light-2">{attr?.value}</div>
                  </div>
                ))}
              </div>
            }
          >
            <div className="flex scale-[1.5] cursor-pointer items-center gap-1  text-dark-6">
              <BsFillInfoCircleFill />
            </div>
          </Tooltip>
          <Pill
            className={`absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 border-[1px] border-border ${rentalTypeColor(
              type
            )}`}
          >
            {rentalTypeName(type)}
          </Pill>
        </div>
      </div>
    </>
  )
}
