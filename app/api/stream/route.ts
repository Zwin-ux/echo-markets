import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type TickRow = { symbol: string; price: number; ts: string }

function sseEncode(obj: any, event?: string) {
  const data = `data: ${JSON.stringify(obj)}\n\n`
  if (event) return `event: ${event}\n${data}`
  return data
}

export async function GET(_req: NextRequest) {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder()
      let isClosed = false

      async function pushSnapshot() {
        if (isClosed) return
        try {
          const ticks = await prisma.tick.findMany({
            orderBy: { timestamp: 'desc' },
            take: 500
          })
          
          const latest = new Map<string, TickRow>()
          for (const tick of ticks) {
            const sym = tick.symbol
            if (!latest.has(sym)) {
              latest.set(sym, { 
                symbol: sym, 
                price: tick.price, 
                ts: tick.timestamp.toISOString() 
              })
            }
          }
          
          const payload = { 
            type: 'prices', 
            at: new Date().toISOString(), 
            items: Array.from(latest.values()) 
          }
          
          if (!isClosed) {
            controller.enqueue(encoder.encode(sseEncode(payload, 'prices')))
          }
        } catch (e) {
          // swallow errors
        }
      }

      function sendHeartbeat() {
        if (!isClosed) {
          try {
            controller.enqueue(encoder.encode(": keep-alive\n\n"))
          } catch {}
        }
      }

      // Initial hello
      controller.enqueue(encoder.encode(": connected\n\n"))
      pushSnapshot()

      const tick = setInterval(pushSnapshot, 3000)
      const heartbeat = setInterval(sendHeartbeat, 15000)

      // Cleanup on client disconnect
      const cleanup = () => {
        isClosed = true
        clearInterval(tick)
        clearInterval(heartbeat)
      }

      // Store cleanup reference
      ;(controller as any)._cleanup = cleanup
    },
    cancel(controller) {
      const cleanup = (controller as any)._cleanup
      if (cleanup) cleanup()
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

