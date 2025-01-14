import type { Badge } from 'config/config'

import { CollectionBadge } from './CollectionBadge'

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  header?: string | JSX.Element
  subHeader?: string | JSX.Element
  badges?: Badge[]
  hero?: JSX.Element
  content?: JSX.Element
  skeleton?: boolean
  className?: string
}

export const Card: React.FC<Props> = ({
  header,
  subHeader,
  badges,
  hero,
  content,
  skeleton,
  className,
  ...props
}: Props) => {
  return (
    <div
      {...props}
      className={`${className} relative flex flex-col gap-2 rounded-lg border-[1px] border-border bg-white bg-opacity-5 p-4`}
    >
      {badges?.map((badge, i) => (
        <div
          key={i}
          className={`absolute z-20 rounded-md bg-dark-5 px-2 py-1 text-sm ${
            {
              'top-right': 'right-6 top-6',
              'top-left': 'left-6 top-6',
              'bottom-right': 'right-6 bottom-6',
              'bottom-left': 'left-6 bottom-6',
            }[badge.position ?? 'top-right']
          }`}
        >
          <CollectionBadge badge={badge} />
        </div>
      ))}
      <div className="aspect-square w-full overflow-hidden rounded-xl">
        {skeleton ? (
          <div className="h-full w-full min-w-[320px] animate-pulse bg-border"></div>
        ) : (
          hero
        )}
      </div>
      {header && (
        <div className="text-lg text-white">
          {skeleton ? (
            <div className="h-5 w-[65%] animate-pulse rounded-md bg-border"></div>
          ) : (
            header
          )}
        </div>
      )}
      {subHeader && (
        <div className="text-lg text-primary">
          {skeleton ? (
            <div className="h-6 w-[40%] animate-pulse rounded-md bg-border"></div>
          ) : (
            subHeader
          )}
        </div>
      )}
      {content && (
        <div className="mt-2 grow">
          {skeleton ? (
            <div className="h-10 w-full animate-pulse rounded-md bg-border"></div>
          ) : (
            content
          )}
        </div>
      )}
    </div>
  )
}
