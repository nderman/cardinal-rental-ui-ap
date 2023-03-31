import { firstParam } from '@cardinal/common'
import { Banner } from 'common/Banner'
import { Browse } from 'components/Browse'
import Error from 'components/Error'
import { Manage } from 'components/Manage'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { useEffect, useState } from 'react'

export default function Home() {
  const { config, setProjectConfig } = useProjectConfig()
  const [tab, setTab] = useState<string>()
  const router = useRouter()

  useEffect(() => {
    const anchor = router.asPath.split('#')[1]
    if (anchor !== tab) setTab(anchor || '')
  }, [router, tab])

  useEffect(() => {
    const collection = firstParam(router.query.collection)
    if (router.query.collection !== config.name && collection) {
      setProjectConfig(collection)
    }
  }, [router.query.collection])

  if (router.query.collection !== config.name) {
    return <Error />
  }

  return (
    <div className="relative z-0 flex min-h-screen flex-col"
    style={{ backgroundColor: '#14181f'}}>
      <Head>
        <title>PharaohRental | {config.displayName}</title>
        <link rel="icon" href="/favicon.ico" />

        <link
          href="https://fonts.googleapis.com/css2?family=Roboto&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Lato:wght@100&display=swap"
          rel="stylesheet"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Kanit:ital@0;1&family=Oswald:wght@200;300;400;500&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Karla:wght@600&display=swap"
          rel="stylesheet"
        />
      </Head>
      <Banner />
      <div style={{ minHeight: 'calc(100vh - 337px)' }} className="grow">
        {(() => {
          switch (tab) {
            case 'manage':
              return <Manage />
            default:
              return <Browse />
          }
        })()}
      </div>
    </div>
  )
}
