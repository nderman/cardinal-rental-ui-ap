import { useState } from 'react'
import { LoadingSpinner } from 'rental-components/common/LoadingSpinner'

export const Button = ({
  children,
  onClick,
  className,
  icon,
  count,
  disabled,
  variant,
}: {
  children: string | JSX.Element
  icon?: JSX.Element
  count?: number
  className?: string
  variant: 'primary' | 'secondary' | 'tertiary'
  disabled?: boolean
  onClick?: () => void
}) => {
  const [loading, setLoading] = useState(false)

  return (
    <div
      className={`flex items-center justify-center gap-5 rounded-md transition-all ${className} ${
        disabled
          ? 'bg-medium-4'
          : variant === 'primary'
          ? 'cursor-pointer bg-primary hover:bg-primary-hover'
          : 'cursor-pointer border-[1px] border-medium-4 hover:border-primary'
      }`}
      onClick={async () => {
        if (!onClick) return
        try {
          setLoading(true)
          await onClick()
        } finally {
          setLoading(false)
        }
      }}
    >
      {loading ? (
        <LoadingSpinner height="25px" />
      ) : (
        <div className="flex items-center justify-center gap-1">
          {children && (
            <div
              className={`py-3 ${disabled ? 'text-medium-3' : 'text-light-0'}`}
            >
              {children}
            </div>
          )}
          {count && (
            <div className="color-primary h-4 w-4 rounded-full bg-white text-xs text-transparent">
              {count}
            </div>
          )}
          {icon && icon}
        </div>
      )}
    </div>
  )
}
