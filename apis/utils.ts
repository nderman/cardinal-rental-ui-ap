import type { Wallet } from '@project-serum/anchor/dist/cjs/provider'
import type {
  ConfirmOptions,
  Connection,
  SendTransactionError,
  Signer,
  Transaction,
} from '@solana/web3.js'
import { sendAndConfirmRawTransaction } from '@solana/web3.js'
import { notify } from 'common/Notification'

import { handleError } from './errors'

export const executeAllTransactions = async (
  connection: Connection,
  wallet: Wallet,
  txs: Transaction[],
  config: {
    throwIndividualError?: boolean
    signers?: Signer[][]
    confirmOptions?: ConfirmOptions
    notificationConfig?: {
      individualSuccesses?: boolean
      successSummary?: boolean
      message?: string
      errorMessage?: string
      description?: string
    }
    callback?: (success: boolean) => void
  },
  preTx?: Transaction
): Promise<{ txid?: string | null; error?: string | null }[]> => {
  const transactions = preTx ? [preTx, ...txs] : txs
  if (transactions.length === 0) return []

  const recentBlockhash = (await connection.getLatestBlockhash()).blockhash
  for (const tx of transactions) {
    tx.feePayer = wallet.publicKey
    tx.recentBlockhash = recentBlockhash
  }
  const signedTransactions = await wallet.signAllTransactions(transactions)

  let txIds: { txid?: string | null; error?: string | null }[] = []
  if (preTx) {
    const signedPreTx = signedTransactions[0]!
    const txid = await sendAndConfirmRawTransaction(
      connection,
      signedPreTx.serialize(),
      config.confirmOptions
    )
    txIds.push({ txid })
  }

  const filteredSignedTransactions = preTx
    ? signedTransactions.slice(1, signedTransactions.length)
    : signedTransactions
  txIds = [
    ...txIds,
    ...(
      await Promise.all(
        filteredSignedTransactions.map(async (tx, index) => {
          try {
            if (
              config.signers &&
              config.signers.length > 0 &&
              config.signers[index]
            ) {
              tx.partialSign(...config.signers[index]!)
            }
            const txid = await sendAndConfirmRawTransaction(
              connection,
              tx.serialize(),
              config.confirmOptions
            )
            config.notificationConfig &&
              config.notificationConfig.individualSuccesses &&
              notify({
                message: `${config.notificationConfig.message} ${
                  index + (preTx ? 2 : 1)
                }/${transactions.length}`,
                description: config.notificationConfig.message,
                txid,
              })
            return { txid }
          } catch (e) {
            const errorMessage = handleError(e, `${e}`)
            console.log(
              'Failed transaction: ',
              (e as SendTransactionError).logs,
              e
            )
            config.notificationConfig &&
              notify({
                message: `${'Failed transaction'} ${index + (preTx ? 2 : 1)}/${
                  transactions.length
                }`,
                description:
                  config.notificationConfig.errorMessage ??
                  handleError(e, `${e}`),
                txid: '',
                type: 'error',
              })
            if (config.throwIndividualError) throw new Error(`${e}`)
            return {
              txid: null,
              error: config.notificationConfig?.errorMessage ?? errorMessage,
            }
          }
        })
      )
    ).filter(({ txid }) => txid),
  ]
  console.log('Successful txs', txIds)
  const successfulTxids = txIds.filter((txid) => txid)
  config.notificationConfig &&
    successfulTxids.length > 0 &&
    notify({
      message: `${config.notificationConfig.message} ${successfulTxids.length}/${transactions.length}`,
      description: config.notificationConfig.description,
      // Consider linking all transactions
      txid: '',
    })
  config.callback && config.callback(true)
  return txIds
}
