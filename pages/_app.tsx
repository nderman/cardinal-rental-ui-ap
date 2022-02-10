import type { AppProps } from 'next/app'
import './styles.css'
import 'antd/dist/antd.css'
import '../styles/globals.css'
import { getWalletAdapters } from '@solana/wallet-adapter-wallets'
import { WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { TokenAccountsProvider } from 'providers/TokenDataProvider'
import { WalletIdentityProvider } from '@cardinal/namespaces-components'

import 'tailwindcss/tailwind.css'
import { EnvironmentProvider } from 'providers/EnvironmentProvider'
import { RentalModalProvider } from 'rental-components/RentalModalProvider'
import { PaymentMintsProvider } from 'providers/PaymentMintsProvider'
import { UTCNowProvider } from 'providers/UTCNowProvider'
import { QRCodeProvider } from 'rental-components/QRCodeProvider'
import { ManagedTokensProvider } from 'providers/ManagedTokensProvider'

require('@solana/wallet-adapter-react-ui/styles.css')

const App = ({ Component, pageProps }: AppProps) => (
  <EnvironmentProvider>
    <WalletProvider wallets={getWalletAdapters()}>
      <WalletIdentityProvider>
        <RentalModalProvider>
          <PaymentMintsProvider>
            <QRCodeProvider>
              <UTCNowProvider>
                <TokenAccountsProvider>
                  <ManagedTokensProvider>
                    <WalletModalProvider>
                      <Component {...pageProps} />
                    </WalletModalProvider>
                  </ManagedTokensProvider>
                </TokenAccountsProvider>
              </UTCNowProvider>
            </QRCodeProvider>
          </PaymentMintsProvider>
        </RentalModalProvider>
      </WalletIdentityProvider>
    </WalletProvider>
  </EnvironmentProvider>
)

export default App
