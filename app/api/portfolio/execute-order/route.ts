import { NextRequest, NextResponse } from 'next/server'
import { portfolioSimulator, type TradeOrder } from '@/lib/portfolio-simulator'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const { userId, symbol, side, quantity, orderType, limitPrice } = body
    
    if (!userId || !symbol || !side || !quantity || !orderType) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, symbol, side, quantity, orderType' },
        { status: 400 }
      )
    }

    // Validate order parameters
    if (!['buy', 'sell'].includes(side)) {
      return NextResponse.json(
        { error: 'Invalid side. Must be "buy" or "sell"' },
        { status: 400 }
      )
    }

    if (!['market', 'limit'].includes(orderType)) {
      return NextResponse.json(
        { error: 'Invalid orderType. Must be "market" or "limit"' },
        { status: 400 }
      )
    }

    if (orderType === 'limit' && !limitPrice) {
      return NextResponse.json(
        { error: 'limitPrice is required for limit orders' },
        { status: 400 }
      )
    }

    if (quantity <= 0) {
      return NextResponse.json(
        { error: 'Quantity must be greater than 0' },
        { status: 400 }
      )
    }

    // Create trade order
    const order: TradeOrder = {
      userId,
      symbol: symbol.toUpperCase(),
      side,
      quantity: parseInt(quantity),
      orderType,
      limitPrice: limitPrice ? parseFloat(limitPrice) : undefined
    }

    // Execute the order
    const result = await portfolioSimulator.executeOrder(order)

    if (result.success) {
      return NextResponse.json({
        success: true,
        orderId: result.orderId,
        executedPrice: result.executedPrice,
        executedQuantity: result.executedQuantity,
        remainingQuantity: result.remainingQuantity,
        timestamp: result.timestamp
      })
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Order execution error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}