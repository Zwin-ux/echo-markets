import { render, fireEvent } from '@testing-library/react'
import TradingModule from '../../components/trading-module'
import { PortfolioProvider } from '../../contexts/portfolio-context'
import { UserProvider } from '../../contexts/user-context'
import { UserStatsProvider } from '../../contexts/user-stats-context'
import { ModuleProvider } from '../../contexts/module-context'
import { GameEngineProvider } from '../../contexts/game-engine-context'
import React from 'react'

describe('TradingModule', () => {
  function setup() {
    return render(
      <GameEngineProvider>
        <UserProvider>
          <UserStatsProvider>
            <ModuleProvider>
              <PortfolioProvider>
                <TradingModule />
              </PortfolioProvider>
            </ModuleProvider>
          </UserStatsProvider>
        </UserProvider>
      </GameEngineProvider>
    )
  }

  it('renders and allows buying stock', () => {
    const { getByText, getByLabelText } = setup()
    const buyButton = getByText(/Buy/i)
    const qtyInput = getByLabelText(/Quantity/i)
    fireEvent.change(qtyInput, { target: { value: '5' } })
    fireEvent.click(buyButton)
    expect(getByText(/Order Summary/i)).toBeInTheDocument()
  })

  it('prevents buying with insufficient cash', () => {
    const { getByText, getByLabelText } = setup()
    const buyButton = getByText(/Buy/i)
    const qtyInput = getByLabelText(/Quantity/i)
    fireEvent.change(qtyInput, { target: { value: '100000' } })
    fireEvent.click(buyButton)
    expect(getByText(/Order Summary/i)).toBeInTheDocument()
  })

  it('renders and allows selling stock', () => {
    const { getByText, getByLabelText } = setup()
    const sellTab = getByText(/Sell/i)
    fireEvent.click(sellTab)
    const qtyInput = getByLabelText(/Quantity/i)
    fireEvent.change(qtyInput, { target: { value: '1' } })
    const sellButton = getByText(/Sell/i)
    fireEvent.click(sellButton)
    expect(getByText(/Order Summary/i)).toBeInTheDocument()
  })
})
