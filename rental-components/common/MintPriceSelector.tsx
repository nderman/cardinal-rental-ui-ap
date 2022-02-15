import React from 'react'
import styled from '@emotion/styled'
import { BN } from '@project-serum/anchor'
import { InputNumber, Select } from 'antd'
import { fmtMintAmount, parseMintNaturalAmountFromDecimal } from 'common/units'
import { usePaymentMints, PAYMENT_MINTS } from 'providers/PaymentMintsProvider'
const { Option } = Select

export const MintPriceSelector = ({
  price,
  mint,
  disabled,
  handlePrice,
  handleMint,
}: {
  price: number
  mint: string
  disabled?: boolean
  handlePrice: (p: number) => void
  handleMint: (m: string) => void
}) => {
  const { paymentMintInfos } = usePaymentMints()
  const paymentMintInfo = paymentMintInfos[mint]
  console.log(paymentMintInfos)
  return (
    <SelectorOuter>
      <InputNumber
        style={{ width: '100%' }}
        placeholder="Price"
        stringMode
        disabled={disabled}
        value={
          paymentMintInfo ? fmtMintAmount(paymentMintInfo, new BN(price)) : '0'
        }
        min="0"
        step={1 / 10 ** (paymentMintInfo?.decimals || 1)}
        onChange={(e) =>
          handlePrice(
            parseMintNaturalAmountFromDecimal(e, paymentMintInfo?.decimals || 1)
          )
        }
      />
      <Select
        onChange={(e) => handleMint(e)}
        defaultValue={PAYMENT_MINTS[0].mint}
        disabled={disabled}
      >
        {PAYMENT_MINTS.map(
          ({ mint, symbol }) =>
            paymentMintInfos[mint] && (
              <Option key={mint} value={mint}>
                {symbol}
              </Option>
            )
        )}
      </Select>
    </SelectorOuter>
  )
}

const SelectorOuter = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;

  div,
  .ant-select-selector {
    border-radius: 4px !important;
  }
`
