import type { Wallet } from '@project-serum/anchor/dist/cjs/provider'
import * as Sentry from '@sentry/browser'
import type {
  BlockheightBasedTransactionConfirmationStrategy,
  ConfirmOptions,
  Connection,
  SendTransactionError,
  Signer,
  Transaction,
} from '@solana/web3.js'
import { handleError } from 'apis/errors'
import { notify } from 'common/Notification'

export const executeTransaction = async (
  connection: Connection,
  wallet: Wallet,
  transaction: Transaction,
  config: {
    silent?: boolean
    signers?: Signer[]
    confirmOptions?: ConfirmOptions
    notificationConfig?: {
      message?: string
      errorMessage?: string
      description?: string
    }
    callback?: () => void
  }
): Promise<string> => {
  let txid = ''
  try {
    transaction.feePayer = wallet.publicKey
    transaction.recentBlockhash = (
      await connection.getRecentBlockhash('max')
    ).blockhash
    transaction = await wallet.signTransaction(transaction)
    if (config.signers && config.signers.length > 0) {
      console.log('partial sign')
      await transaction.partialSign(...config.signers)
    }
    txid = await connection.sendRawTransaction(
      transaction.serialize(),
      config.confirmOptions
    )
    const confirmStrategy: BlockheightBasedTransactionConfirmationStrategy = {
      blockhash: latestBlockhash.blockhash as string,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      signature: txid
    }
    const result = await connection.confirmTransaction(confirmStrategy)
    console.log('Successful tx', result)
    config.notificationConfig &&
      notify({
        message: 'Succesful transaction',
        description: config.notificationConfig.message,
        txid,
      })
  } catch (e) {
    console.log('Failed transaction: ', e, (e as SendTransactionError).logs)
    const errorMessage = handleError(e, `${e}`)
    console.log(errorMessage)
    Sentry.captureException(e, {
      tags: { type: 'transaction' },
      extra: { errorMessage },
      fingerprint: [errorMessage],
    })
    config.notificationConfig &&
      notify({
        message: 'Failed transaction',
        description: config.notificationConfig.errorMessage ?? errorMessage,
        txid,
        type: 'error',
      })
    if (!config.silent) throw new Error(errorMessage)
  } finally {
    config.callback && config.callback()
  }
  return txid
}
