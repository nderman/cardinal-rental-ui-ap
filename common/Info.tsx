import { GlyphActivity } from 'assets/GlyphActivity'
import { GlyphPerformance } from 'assets/GlyphPerformance'
import { GlyphQuestion } from 'assets/GlyphQuestion'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { AiFillStar, AiOutlineShoppingCart } from 'react-icons/ai'
import { MdAccessTimeFilled, MdSell } from 'react-icons/md'

export type InfoIcon =
  | 'time'
  | 'featured'
  | 'listed'
  | 'rented'
  | 'available'
  | 'info'
  | 'performance'
  | 'activity'

type Props = {
  colorized?: boolean
  header?: string
  description?: string
  icon?: InfoIcon
}
export const Info: React.FC<Props> = ({
  header,
  description,
  icon,
  colorized,
}: Props) => {
  const { config } = useProjectConfig()
  return (
    <div className="relative z-0 mx-10 mt-10 flex items-center gap-4 overflow-hidden rounded-xl px-8 py-4 text-xl">

      <div className="text-white">
        {icon &&
          {
            time: <MdAccessTimeFilled />,
            featured: <AiFillStar />,
            listed: <AiOutlineShoppingCart />,
            rented: <AiOutlineShoppingCart />,
            available: (
              <MdSell className="h-[68px] w-[68px] rounded-full border-[2px] border-medium-4 p-3" />
            ),
            info: <GlyphQuestion />,
            activity: (
              <div className="flex h-[68px] w-[68px] items-center justify-center rounded-full border-[2px] border-medium-4 p-3">
                <div className="scale-[2]">
                  <GlyphActivity />
                </div>
              </div>
            ),
            performance: <GlyphPerformance />,
          }[icon]}
      </div>
      <div className="flex flex-col">
        <div className="text-medium-3">{header}</div>
        <div className="text-light-0">{description}</div>
      </div>
    </div>
  )
}
