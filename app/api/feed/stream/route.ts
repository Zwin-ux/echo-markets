import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function sse(obj: any, event?: string) {
  const chunk = `${event ? `event: ${event}\n` : ''}data: ${JSON.stringify(obj)}\n\n`
  return new TextEncoder().encode(chunk)
}

export async function GET(_req: NextRequest) {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(sse({ ok: true }, 'hello'))

      // TODO: Implement WebSocket-based real-time updates
      // For now, send periodic updates with recent trades
      const sendRecentTrades = async () => {
        try {
          const recentTrades = await prisma.trade.findMany({
            include: {
              buyer: { select: { name: true } },
              seller: { select: { name: true } }
            },
            orderBy: { timestamp: 'desc' },
            take: 5
          })

          for (const trade of recentTrades) {
            const item = {
              type: 'trade',
              id: trade.id,
              ts: trade.timestamp.toISOString(),
              symbol: trade.symbol,
              price: trade.price,
              qty: trade.qty,
              buy_username: trade.buyer.name || 'Anonymous',
              sell_username: trade.seller.name || 'Anonymous',
            }
            controller.enqueue(sse(item, 'trade'))
          }
        } catch (e) {
          // swallow errors
        }
      }

      // Send initial data
      sendRecentTrades()

      // Send periodic updates (every 30 seconds)
      const updateInterval = setInterval(sendRecentTrades, 30000)
      
      // Send heartbeat every 15 seconds
      const heartbeat = setInterval(() => controller.enqueue(sse({ t: Date.now() }, 'ping')), 15000)

      ;(controller as any)._cleanup = () => {
        clearInterval(heartbeat)
        clearInterval(updateInterval)
      }
    },
    cancel() {
      // @ts-ignore
      this._cleanup?.()
    },
  })

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}

