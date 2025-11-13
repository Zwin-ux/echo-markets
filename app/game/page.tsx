"use client"

import { useState, useMemo, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import type { LucideIcon } from "lucide-react"
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Crown,
  Star,
  Flame,
  Rocket,
  Zap,
  Users,
  Target,
  ArrowUp,
  ArrowDown,
  Radio,
  Newspaper,
  Swords,
  Gauge,
  Trophy,
  Bell,
  Sparkles,
  Timer,
  BarChart3,
  PieChart,
  MessageCircle,
  Shield,
  Ghost,
  CloudLightning,
  Megaphone,
  Gavel,
  Award
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Stock {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
  volatility: number
  momentum: number
  sector: string
  storyline: string
  sentiment: "bullish" | "bearish" | "volatile"
}

interface Position {
  symbol: string
  shares: number
  avgPrice: number
  currentValue: number
  pnl: number
  pnlPercent: number
}

interface Player {
  id: string
  username: string
  level: number
  xp: number
  totalValue: number
  dayChange: number
  rank: number
  achievements: string[]
  streak: number
}

interface MarketEvent {
  id: string
  title: string
  description: string
  tone: "panic" | "hype" | "scheming" | "mystery"
  impact: number
  affected: string[]
  timestamp: Date
}

interface NarrativeOption {
  id: string
  label: string
  description: string
  effect: {
    drama: number
    influence: number
    momentumShift?: Record<string, number>
    rumor?: string
  }
  nextBeat?: string
}

interface StoryBeat {
  id: string
  title: string
  synopsis: string
  mood: "bullish" | "bearish" | "chaotic"
  tags: string[]
  options: NarrativeOption[]
}

interface ActionFeedItem {
  id: string
  type: "story" | "trade" | "impulse" | "system"
  text: string
  timestamp: Date
}

interface CommunityImpulse {
  id: string
  label: string
  description: string
  icon: LucideIcon
  effect: {
    drama: number
    influence: number
    sentiment: "panic" | "hype" | "chaos"
    boost?: Record<string, number>
  }
  cooldown: number
}

const PLAYER_STARTING_VALUE = 12000

const INITIAL_STOCKS: Stock[] = [
  {
    symbol: "SCNDL",
    name: "Scandal Forge",
    price: 48.2,
    change: 1.4,
    changePercent: 3.0,
    volume: 2150000,
    volatility: 0.7,
    momentum: 1.2,
    sector: "Gossip",
    storyline: "Mega-influencer meltdown sparks brand war livestreams.",
    sentiment: "bullish"
  },
  {
    symbol: "HYPE",
    name: "Hypercast Network",
    price: 73.8,
    change: -2.1,
    changePercent: -2.7,
    volume: 1850000,
    volatility: 0.5,
    momentum: -0.6,
    sector: "Media",
    storyline: "Leaked pilot shows unhinged reality reboot.",
    sentiment: "volatile"
  },
  {
    symbol: "MTHR",
    name: "Mythic Robotics",
    price: 132.6,
    change: 6.8,
    changePercent: 5.4,
    volume: 950000,
    volatility: 0.4,
    momentum: 1.6,
    sector: "AI",
    storyline: "Prototype rumored to dream about shareholders.",
    sentiment: "bullish"
  },
  {
    symbol: "FURY",
    name: "Fury Motorsports",
    price: 25.1,
    change: -0.8,
    changePercent: -3.1,
    volume: 3200000,
    volatility: 0.9,
    momentum: -1.1,
    sector: "Culture",
    storyline: "Driver feud escalates into faction street rallies.",
    sentiment: "bearish"
  },
  {
    symbol: "ORCL",
    name: "Oracle of Echo",
    price: 16.4,
    change: 0.4,
    changePercent: 2.5,
    volume: 450000,
    volatility: 0.3,
    momentum: 0.5,
    sector: "Rumors",
    storyline: "Anonymous zine drops prophecy about market eclipse.",
    sentiment: "volatile"
  },
  {
    symbol: "VIBE",
    name: "Vibe Syndicate",
    price: 58.9,
    change: 1.1,
    changePercent: 1.9,
    volume: 1650000,
    volatility: 0.6,
    momentum: 0.9,
    sector: "Nightlife",
    storyline: "Secret rave rumored to mint a new social currency.",
    sentiment: "bullish"
  }
]

const STORY_BEATS: StoryBeat[] = [
  {
    id: "festival",
    title: "The Festival Leak",
    synopsis: "EchoFest's leaked lineup hints at a forbidden reunion set.",
    mood: "chaotic",
    tags: ["music", "nostalgia", "contracts"],
    options: [
      {
        id: "reunion",
        label: "Push the reunion",
        description: "Signal-boost the rumor. If it lands, nostalgia money floods the market.",
        effect: {
          drama: 12,
          influence: 6,
          momentumShift: { VIBE: 0.5, HYPE: 0.2 },
          rumor: "EchoFest headliner teased a midnight archive drop."
        },
        nextBeat: "backlash"
      },
      {
        id: "sabotage",
        label: "Expose the leak",
        description: "Flip the script. Leak the contract dispute and spook the hype traders.",
        effect: {
          drama: 8,
          influence: 8,
          momentumShift: { SCNDL: 0.6, HYPE: -0.4 },
          rumor: "Insider legal memo suggests the reunion could implode onstage."
        },
        nextBeat: "investigation"
      }
    ]
  },
  {
    id: "backlash",
    title: "Fan Backlash Spiral",
    synopsis: "Clans split on whether nostalgia sells out the culture.",
    mood: "bearish",
    tags: ["fandom", "boycott"],
    options: [
      {
        id: "appease",
        label: "Stage a charity gesture",
        description: "Calm the mobs with a benefit stream for burnt-out mods.",
        effect: {
          drama: -6,
          influence: 4,
          momentumShift: { VIBE: -0.2, ORCL: 0.3 },
          rumor: "Charity stream numbers quietly dwarf the headliner presale."
        },
        nextBeat: "investigation"
      },
      {
        id: "lean-in",
        label: "Double down on chaos",
        description: "Incite a hype war between Hypehouse and Skeptics. Let markets burn.",
        effect: {
          drama: 15,
          influence: 10,
          momentumShift: { HYPE: 0.6, FURY: 0.5 },
          rumor: "Faction war rooms scheduling simultaneous rumor drops."
        },
        nextBeat: "collapse"
      }
    ]
  },
  {
    id: "investigation",
    title: "The Investigation Thread",
    synopsis: "Citizen-analysts compile red strings tracking corporate shadowplays.",
    mood: "bullish",
    tags: ["sleuths", "deep dive"],
    options: [
      {
        id: "ally-npc",
        label: "Recruit NPC analysts",
        description: "Let the AI desk spin up reports that flatter your storyline.",
        effect: {
          drama: 5,
          influence: 5,
          momentumShift: { ORCL: 0.4, MTHR: 0.3 },
          rumor: "NPC quant leaked a thread connecting robotic dreams to EchoFest."
        },
        nextBeat: "festival"
      },
      {
        id: "shadow-drop",
        label: "Drop a midnight dossier",
        description: "Publish alleged emails tying Fury Motorsports to hush-money.",
        effect: {
          drama: 11,
          influence: 9,
          momentumShift: { FURY: -0.6, SCNDL: 0.5 },
          rumor: "Encrypted zip file cracks open to reveal payout receipts."
        },
        nextBeat: "collapse"
      }
    ]
  },
  {
    id: "collapse",
    title: "Market Breakdown Revue",
    synopsis: "Liquidity evaporates as rumor desks spiral into performance art.",
    mood: "chaotic",
    tags: ["meltdown", "performance"],
    options: [
      {
        id: "stabilize",
        label: "Stage a coordinated rescue",
        description: "Call in Analysts faction to host a calm-space AMA.",
        effect: {
          drama: -12,
          influence: 7,
          momentumShift: { MTHR: 0.2, HYPE: -0.5 },
          rumor: "Analysts release a serenity pack—markets breathe for eight minutes."
        },
        nextBeat: "festival"
      },
      {
        id: "embrace",
        label: "Embrace the breakdown",
        description: "Trigger a chaos dividend. Panic becomes its own asset class.",
        effect: {
          drama: 18,
          influence: 12,
          momentumShift: { SCNDL: 0.7, VIBE: 0.4, FURY: -0.3 },
          rumor: "New derivative launches: Volatility Futures on community mood swings."
        },
        nextBeat: "investigation"
      }
    ]
  }
]

const COMMUNITY_IMPULSES: CommunityImpulse[] = [
  {
    id: "panic",
    label: "Trigger Panic Ping",
    description: "Flash a red banner that makes NPC traders dump anything smug.",
    icon: CloudLightning,
    effect: {
      drama: 9,
      influence: 3,
      sentiment: "panic",
      boost: { FURY: -0.5, HYPE: -0.3 }
    },
    cooldown: 40
  },
  {
    id: "hype",
    label: "Launch Hype Storm",
    description: "Raid the feeds with glitter edits and leak a fake trailer.",
    icon: Rocket,
    effect: {
      drama: 7,
      influence: 5,
      sentiment: "hype",
      boost: { VIBE: 0.6, SCNDL: 0.4 }
    },
    cooldown: 35
  },
  {
    id: "whisper",
    label: "Seed Whisper Network",
    description: "Quiet drop a rumor to Analysts. Watch the prophecy stock move first.",
    icon: Ghost,
    effect: {
      drama: 5,
      influence: 4,
      sentiment: "chaos",
      boost: { ORCL: 0.5, MTHR: 0.2 }
    },
    cooldown: 30
  }
]

const FACTION_HIGHLIGHTS: Array<{
  name: string
  motto: string
  icon: LucideIcon
  focus: string
}> = [
  {
    name: "Hypehouse",
    motto: "If it trends, we bend reality around it.",
    icon: Sparkles,
    focus: "Amplifies leaks, runs midnight pump rituals."
  },
  {
    name: "Skeptics",
    motto: "Question every line break.",
    icon: Shield,
    focus: "Exposes frauds, loves tanking smug tickers."
  },
  {
    name: "Insiders",
    motto: "Truth is a limited airdrop.",
    icon: Radio,
    focus: "Drops coded messages and insider spreadsheets."
  },
  {
    name: "Degens",
    motto: "Volatility is church.",
    icon: Megaphone,
    focus: "Craves chaos dividends and zero-sleep trading sessions."
  },
  {
    name: "Analysts",
    motto: "We annotate the apocalypse.",
    icon: PieChart,
    focus: "Turns gossip into dashboards and meta commentary."
  }
]

const VOTE_DURATION = 45

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export default function GamePage() {
  const [stocks, setStocks] = useState<Stock[]>(INITIAL_STOCKS)
  const [player, setPlayer] = useState<Player>({
    id: "demo-player",
    username: "SignalSeer",
    level: 4,
    xp: 1850,
    totalValue: PLAYER_STARTING_VALUE,
    dayChange: 0,
    rank: 17,
    achievements: ["rumor_monger", "early_hype"],
    streak: 3
  })
  const [positions, setPositions] = useState<Position[]>([])
  const [cash, setCash] = useState<number>(PLAYER_STARTING_VALUE)
  const [selectedStock, setSelectedStock] = useState<Stock | null>(INITIAL_STOCKS[0])
  const [orderType, setOrderType] = useState<"buy" | "sell">("buy")
  const [orderAmount, setOrderAmount] = useState<string>("")
  const [dramaScore, setDramaScore] = useState<number>(68)
  const [marketEvents, setMarketEvents] = useState<MarketEvent[]>([])
  const [notifications, setNotifications] = useState<string[]>([])
  const [actionFeed, setActionFeed] = useState<ActionFeedItem[]>([])
  const [communityVotes, setCommunityVotes] = useState<Record<string, number>>({})
  const [currentBeatId, setCurrentBeatId] = useState<string>(STORY_BEATS[0].id)
  const [voteTimer, setVoteTimer] = useState<number>(VOTE_DURATION)
  const [influence, setInfluence] = useState<number>(42)
  const [impulseCooldowns, setImpulseCooldowns] = useState<Record<string, number>>({})
  const [leaderboard, setLeaderboard] = useState<Player[]>([])
  const [isExecutingOrder, setIsExecutingOrder] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<"loop" | "portfolio" | "culture">("loop")

  const stocksRef = useRef(stocks)
  const dramaRef = useRef(dramaScore)

  const currentBeat = useMemo(
    () => STORY_BEATS.find((beat) => beat.id === currentBeatId) ?? STORY_BEATS[0],
    [currentBeatId]
  )

  const portfolioValue = useMemo(() => {
    const holdings = positions.reduce((total, position) => {
      const stock = stocks.find((item) => item.symbol === position.symbol)
      const price = stock ? stock.price : position.avgPrice
      return total + price * position.shares
    }, 0)

    return cash + holdings
  }, [positions, stocks, cash])

  const totalVotes = useMemo(
    () => Object.values(communityVotes).reduce((sum, count) => sum + count, 0),
    [communityVotes]
  )

  const registerAction = useCallback((item: ActionFeedItem) => {
    setActionFeed((prev) => [item, ...prev].slice(0, 12))
  }, [])

  const pushNotification = useCallback((message: string) => {
    setNotifications((prev) => [message, ...prev].slice(0, 6))
  }, [])

  const updatePlayerValue = useCallback((nextTotal: number) => {
    setPlayer((prev) => {
      const nextDayChange = nextTotal - PLAYER_STARTING_VALUE
      if (
        Math.abs(prev.totalValue - nextTotal) < 0.01 &&
        Math.abs(prev.dayChange - nextDayChange) < 0.01
      ) {
        return prev
      }

      return {
        ...prev,
        totalValue: nextTotal,
        dayChange: nextDayChange
      }
    })
  }, [])

  const applyStockMomentum = useCallback((adjustments: Record<string, number>) => {
    if (!Object.keys(adjustments).length) return

    setStocks((prev) =>
      prev.map((stock) => {
        const shift = adjustments[stock.symbol]
        if (!shift) return stock

        const changePercent = clamp(shift * 5, -20, 20)
        const newPrice = clamp(stock.price * (1 + changePercent / 100), 1, 999)
        const change = newPrice - stock.price

        return {
          ...stock,
          price: Math.round(newPrice * 100) / 100,
          change: Math.round(change * 100) / 100,
          changePercent: Math.round(changePercent * 100) / 100,
          momentum: clamp(stock.momentum + shift, -2, 2),
          sentiment: shift > 0 ? "bullish" : "bearish"
        }
      })
    )
  }, [])

  const resolveNarrative = useCallback(
    (option: NarrativeOption) => {
      const timestamp = new Date()

      if (option.effect.momentumShift) {
        applyStockMomentum(option.effect.momentumShift)
      }

      if (option.effect.rumor) {
        const rumorEvent: MarketEvent = {
          id: `rumor-${timestamp.getTime()}`,
          title: option.effect.rumor,
          description: `${currentBeat.title} community vote resolved: ${option.label}.`,
          tone: option.effect.drama >= 0 ? "hype" : "scheming",
          impact: Math.abs(option.effect.drama) / 15,
          affected: Object.keys(option.effect.momentumShift ?? {}),
          timestamp
        }

        setMarketEvents((prev) => [rumorEvent, ...prev].slice(0, 8))
      }

      setDramaScore((prev) => clamp(prev + option.effect.drama, 0, 100))
      setInfluence((prev) => prev + option.effect.influence)

      registerAction({
        id: `story-${timestamp.getTime()}`,
        type: "story",
        text: `Community steered the arc: ${option.label}. Influence ripples through the floor.`,
        timestamp
      })

      pushNotification(`Story advanced: ${currentBeat.title} → ${option.label}`)

      setCommunityVotes({})
      setVoteTimer(VOTE_DURATION)

      if (option.nextBeat) {
        setCurrentBeatId(option.nextBeat)
      } else {
        const fallback = STORY_BEATS[Math.floor(Math.random() * STORY_BEATS.length)]
        setCurrentBeatId(fallback.id)
      }
    },
    [applyStockMomentum, currentBeat, pushNotification, registerAction]
  )

  const tallyNarrative = useCallback(() => {
    const options = currentBeat.options
    if (!options.length) return

    let winning = options[0]
    let highest = -Infinity

    options.forEach((option) => {
      const votes = communityVotes[option.id] ?? 0
      if (votes > highest) {
        winning = option
        highest = votes
      }
    })

    resolveNarrative(winning)
  }, [communityVotes, currentBeat, resolveNarrative])

  const handleVote = useCallback(
    (option: NarrativeOption) => {
      setCommunityVotes((prev) => ({
        ...prev,
        [option.id]: (prev[option.id] ?? 0) + 1
      }))

      setInfluence((prev) => prev + 1)

      registerAction({
        id: `vote-${Date.now()}`,
        type: "story",
        text: `You cast your vote for "${option.label}". Narrative gravity shifts.`,
        timestamp: new Date()
      })
    },
    [registerAction]
  )

  const handleImpulse = useCallback(
    (impulse: CommunityImpulse) => {
      if (impulseCooldowns[impulse.id] && impulseCooldowns[impulse.id] > 0) return

      const timestamp = new Date()

      if (impulse.effect.boost) {
        applyStockMomentum(impulse.effect.boost)
      }

      setDramaScore((prev) => {
        const next = clamp(prev + impulse.effect.drama, 0, 100)
        pushNotification(`${impulse.label} launched. Drama is now ${Math.round(next)}.`)
        return next
      })

      setInfluence((prev) => prev + impulse.effect.influence)
      setImpulseCooldowns((prev) => ({ ...prev, [impulse.id]: impulse.cooldown }))

      const event: MarketEvent = {
        id: `impulse-${timestamp.getTime()}`,
        title: `${impulse.label} detonated`,
        description: impulse.description,
        tone: impulse.effect.sentiment === "panic" ? "panic" : "hype",
        impact: impulse.effect.drama / 10,
        affected: Object.keys(impulse.effect.boost ?? {}),
        timestamp
      }

      setMarketEvents((prev) => [event, ...prev].slice(0, 8))

      registerAction({
        id: `impulse-${timestamp.getTime()}`,
        type: "impulse",
        text: `${impulse.label} ripples through the pit. ${impulse.effect.sentiment.toUpperCase()} spreads.`,
        timestamp
      })
    },
    [applyStockMomentum, impulseCooldowns, pushNotification, registerAction]
  )

  const handleExecuteOrder = useCallback(async () => {
    if (!selectedStock) return
    const numericAmount = Number(orderAmount)
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return

    setIsExecutingOrder(true)

    try {
      const response = await fetch("/api/game/execute-trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: player.id,
          symbol: selectedStock.symbol,
          side: orderType,
          amount: numericAmount,
          type: "market"
        })
      })

      const payload = await response.json()
      if (!response.ok || !payload.success) {
        pushNotification(`❌ Trade failed: ${payload.error ?? "Unknown error"}`)
        return
      }

      const trade = payload.data.trade
      const rewards = payload.data.rewards

      if (orderType === "buy") {
        setCash((prev) => prev - trade.totalCost)
        setPositions((prev) => {
          const existing = prev.find((position) => position.symbol === selectedStock.symbol)
          if (!existing) {
            return [
              ...prev,
              {
                symbol: selectedStock.symbol,
                shares: trade.shares,
                avgPrice: trade.executedPrice,
                currentValue: trade.totalCost,
                pnl: 0,
                pnlPercent: 0
              }
            ]
          }

          const totalShares = existing.shares + trade.shares
          const totalCost = existing.avgPrice * existing.shares + trade.totalCost
          const newAvg = totalCost / totalShares

          return prev.map((position) =>
            position.symbol === selectedStock.symbol
              ? {
                  ...position,
                  shares: totalShares,
                  avgPrice: newAvg,
                  currentValue: totalShares * selectedStock.price
                }
              : position
          )
        })
      } else {
        setCash((prev) => prev + trade.totalCost)
        setPositions((prev) =>
          prev
            .map((position) =>
              position.symbol === selectedStock.symbol
                ? {
                    ...position,
                    shares: position.shares - trade.shares,
                    currentValue: Math.max(0, (position.shares - trade.shares) * selectedStock.price)
                  }
                : position
            )
            .filter((position) => position.shares > 0)
        )
      }

      setPlayer((prev) => ({
        ...prev,
        xp: prev.xp + rewards.xpGained,
        level: rewards.levelUp ? prev.level + 1 : prev.level,
        achievements: rewards.achievements.length
          ? Array.from(new Set([...prev.achievements, ...rewards.achievements]))
          : prev.achievements
      }))

      const influenceBoost = Math.max(1, Math.floor(rewards.xpGained / 40))
      setInfluence((prev) => prev + influenceBoost)

      registerAction({
        id: `trade-${trade.orderId}`,
        type: "trade",
        text: `${orderType.toUpperCase()} ${trade.shares} ${selectedStock.symbol} @ $${trade.executedPrice.toFixed(
          2
        )}. Influence +${influenceBoost}.`,
        timestamp: new Date(trade.timestamp)
      })

      pushNotification(`${orderType.toUpperCase()} executed: ${trade.shares} ${selectedStock.symbol}`)
      setOrderAmount("")
    } catch (error) {
      console.error("Trade execution failed", error)
      pushNotification("❌ Trade failed: network error")
    } finally {
      setIsExecutingOrder(false)
    }
  }, [orderAmount, orderType, player.id, pushNotification, registerAction, selectedStock])

  useEffect(() => {
    updatePlayerValue(Math.round(portfolioValue))
  }, [portfolioValue, updatePlayerValue])

  useEffect(() => {
    stocksRef.current = stocks
  }, [stocks])

  useEffect(() => {
    dramaRef.current = dramaScore
  }, [dramaScore])

  useEffect(() => {
    setPositions((prev) =>
      prev.map((position) => {
        const stock = stocks.find((item) => item.symbol === position.symbol)
        if (!stock) return position

        const currentValue = stock.price * position.shares
        const pnl = currentValue - position.avgPrice * position.shares

        return {
          ...position,
          currentValue,
          pnl,
          pnlPercent: position.avgPrice === 0 ? 0 : (pnl / (position.avgPrice * position.shares)) * 100
        }
      })
    )
  }, [stocks])

  useEffect(() => {
    const interval = setInterval(() => {
      setStocks((prev) =>
        prev.map((stock) => {
          const moodBoost = currentBeat.mood === "bullish" ? 0.3 : currentBeat.mood === "bearish" ? -0.3 : 0
          const drama = dramaRef.current
          const dramaMultiplier = 0.6 + drama / 120
          const randomness = (Math.random() - 0.5) * stock.volatility * 20 * dramaMultiplier
          const momentumInfluence = stock.momentum * 1.8
          const change = randomness + momentumInfluence + moodBoost * 2
          const newPrice = clamp(stock.price + change, 1, 999)
          const changePercent = ((newPrice - stock.price) / stock.price) * 100

          return {
            ...stock,
            price: Math.round(newPrice * 100) / 100,
            change: Math.round((newPrice - stock.price) * 100) / 100,
            changePercent: Math.round(changePercent * 100) / 100,
            momentum: clamp(stock.momentum * 0.82 + changePercent / 50, -2, 2)
          }
        })
      )

      setDramaScore((prev) => clamp(prev + (Math.random() - 0.55) * 6, 0, 100))
    }, 4000)

    return () => clearInterval(interval)
  }, [currentBeat.mood])

  useEffect(() => {
    const timer = setInterval(() => {
      setImpulseCooldowns((prev) => {
        const next: Record<string, number> = {}
        let changed = false

        Object.entries(prev).forEach(([id, value]) => {
          const updated = Math.max(0, value - 1)
          next[id] = updated
          if (updated !== value) changed = true
        })

        return changed ? next : prev
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setVoteTimer((prev) => {
        if (prev <= 1) {
          tallyNarrative()
          return VOTE_DURATION
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [tallyNarrative])

  useEffect(() => {
    const interval = setInterval(() => {
      const rumorSeed = [
        "Anonymous vault posts blurry screenshot of Oracle terminal.",
        "NPC traders form support group after Fury flameout.",
        "Leaked merch drop reveals hidden coordinates.",
        "Skeptics publish spreadsheet linking hype bots to whale wallet.",
        "Degens announce 48-hour livestreamed derivatives ritual."
      ]
      const pool = stocksRef.current
      const affected = pool[Math.floor(Math.random() * pool.length)]
      const timestamp = new Date()

      setMarketEvents((prev) => [
        {
          id: `ambient-${timestamp.getTime()}`,
          title: rumorSeed[Math.floor(Math.random() * rumorSeed.length)],
          description: `${affected.symbol} reacts with a twitch.`,
          tone: "mystery",
          impact: 0.2,
          affected: [affected.symbol],
          timestamp
        },
        ...prev
      ].slice(0, 8))

      registerAction({
        id: `ambient-${timestamp.getTime()}`,
        type: "system",
        text: `Rumor ticker pinged ${affected.symbol}.`,
        timestamp
      })
    }, 22000)

    return () => clearInterval(interval)
  }, [registerAction])

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch("/api/game/leaderboard")
        if (!response.ok) return
        const data = await response.json()
        if (data.success) {
          setLeaderboard(data.data.leaderboard)
        }
      } catch (error) {
        console.error("Failed to load leaderboard", error)
      }
    }

    fetchLeaderboard()
    const interval = setInterval(fetchLeaderboard, 30000)
    return () => clearInterval(interval)
  }, [])

  if (!stocks.length) {
    return (
      <div className="min-h-screen bg-black text-cyan-400 font-mono flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="text-xl">Booting Echo Markets...</div>
          <div className="text-sm text-cyan-300">Calibrating rumor engines and community sentiment.</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-cyan-300 font-mono">
      <header className="border-b border-cyan-500/30 bg-gray-950/70">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center space-x-4">
            <Image
              src="/LATTICE Logo in Neon Turquoise.png"
              alt="Echo Markets"
              width={44}
              height={44}
              className="brightness-125"
            />
            <div>
              <h1 className="text-2xl font-bold text-cyan-400">Echo Markets</h1>
              <p className="text-xs text-gray-400">Emotion-priced markets. Culture is the index.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center space-x-2">
              <Crown className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-400 text-sm">#{player.rank}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Star className="w-4 h-4 text-purple-400" />
              <span className="text-purple-300 text-sm">Lv.{player.level}</span>
              <Progress value={(player.xp % 1000) / 10} className="w-20 h-2 bg-gray-800" />
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-400">Portfolio Power</div>
              <div className="text-lg text-cyan-200 font-bold">${portfolioValue.toLocaleString()}</div>
              <div className={`text-xs ${player.dayChange >= 0 ? "text-green-400" : "text-red-400"}`}>
                {player.dayChange >= 0 ? "+" : ""}${player.dayChange.toFixed(2)} today
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4 text-cyan-300" />
              {notifications.length > 0 && (
                <Badge className="bg-red-500 text-white text-xs">{notifications.length}</Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
          <TabsList className="bg-gray-900/70 border border-cyan-500/30 text-gray-400">
            <TabsTrigger value="loop" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300">
              <BarChart3 className="w-4 h-4 mr-2" /> Core Loop
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300">
              <PieChart className="w-4 h-4 mr-2" /> Portfolio
            </TabsTrigger>
            <TabsTrigger value="culture" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300">
              <Users className="w-4 h-4 mr-2" /> Culture
            </TabsTrigger>
          </TabsList>

          <TabsContent value="loop" className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 space-y-6">
                <Card className="bg-gray-950/80 border-cyan-500/40">
                  <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <CardTitle className="flex items-center text-cyan-300 text-lg">
                        <Gavel className="w-5 h-5 mr-2" /> Narrative Pulse
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        Vote on the next beat. Timer resets when the market decides.
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1 text-cyan-200">
                        <Timer className="w-4 h-4" /> {voteTimer}s
                      </div>
                      <div className="flex items-center gap-1 text-cyan-200">
                        <Users className="w-4 h-4" /> {totalVotes} votes
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 rounded-lg border border-cyan-500/20 bg-black/40">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="uppercase text-xs tracking-widest">
                          {currentBeat.mood}
                        </Badge>
                        <div className="text-xs text-gray-400 space-x-2">
                          {currentBeat.tags.map((tag) => (
                            <span key={tag}>#{tag}</span>
                          ))}
                        </div>
                      </div>
                      <h2 className="text-xl text-cyan-200 mt-2">{currentBeat.title}</h2>
                      <p className="text-sm text-gray-300 mt-2 leading-relaxed">{currentBeat.synopsis}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {currentBeat.options.map((option) => {
                        const votes = communityVotes[option.id] ?? 0
                        const share = totalVotes ? Math.round((votes / totalVotes) * 100) : 0
                        return (
                          <button
                            key={option.id}
                            onClick={() => handleVote(option)}
                            className="group relative p-4 border border-cyan-500/20 rounded-lg text-left bg-black/40 hover:border-cyan-400 transition"
                          >
                            <div className="flex items-start justify-between">
                              <div className="font-semibold text-cyan-200">{option.label}</div>
                              <Badge className="bg-cyan-600/80 text-black text-xs">{votes} votes</Badge>
                            </div>
                            <p className="text-sm text-gray-300 mt-2 leading-relaxed">{option.description}</p>
                            <div className="mt-3 text-xs text-gray-400 space-y-1">
                              <div className="flex items-center gap-2">
                                <Flame className="w-3 h-3 text-orange-400" /> Drama {option.effect.drama >= 0 ? "+" : ""}{option.effect.drama}
                              </div>
                              <div className="flex items-center gap-2">
                                <Star className="w-3 h-3 text-purple-400" /> Influence +{option.effect.influence}
                              </div>
                              {share > 0 && <Progress value={share} className="h-1 bg-gray-800" />}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-950/80 border-cyan-500/40">
                  <CardHeader className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center text-cyan-300 text-lg">
                        <Activity className="w-5 h-5 mr-2" /> Market Pulse
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        Emotion-priced tickers reacting to the story so far.
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex items-center gap-2 text-cyan-200">
                        <Gauge className="w-4 h-4" /> Drama {Math.round(dramaScore)}
                      </div>
                      <div className="flex items-center gap-2 text-green-300">
                        <TrendingUp className="w-4 h-4" /> Bullish {stocks.filter((stock) => stock.changePercent > 0).length}
                      </div>
                      <div className="flex items-center gap-2 text-red-300">
                        <TrendingDown className="w-4 h-4" /> Bearish {stocks.filter((stock) => stock.changePercent < 0).length}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {stocks.map((stock) => (
                        <div
                          key={stock.symbol}
                          className={`p-4 rounded-lg border transition-all cursor-pointer ${
                            selectedStock?.symbol === stock.symbol
                              ? "border-cyan-400 bg-cyan-500/10 shadow-[0_0_20px_rgba(34,211,238,0.2)]"
                              : "border-gray-800 hover:border-cyan-400/50"
                          }`}
                          onClick={() => setSelectedStock(stock)}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="text-lg font-bold text-cyan-200">{stock.symbol}</div>
                              <div className="text-xs text-gray-400">{stock.name}</div>
                              <Badge variant="outline" className="text-xs mt-1 uppercase">
                                {stock.sector}
                              </Badge>
                            </div>
                            <div className="text-right">
                              <div className="text-lg text-cyan-100">${stock.price.toFixed(2)}</div>
                              <div
                                className={`text-xs flex items-center justify-end ${
                                  stock.changePercent >= 0 ? "text-green-400" : "text-red-400"
                                }`}
                              >
                                {stock.changePercent >= 0 ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                                {Math.abs(stock.changePercent).toFixed(2)}%
                              </div>
                            </div>
                          </div>
                          <p className="text-xs text-gray-400 mt-3 leading-relaxed">{stock.storyline}</p>
                          <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
                            <span>Momentum</span>
                            <div className="flex-1 bg-gray-800 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-2 ${stock.momentum >= 0 ? "bg-green-400" : "bg-red-400"}`}
                                style={{ width: `${clamp(Math.abs(stock.momentum) * 50, 5, 100)}%` }}
                              />
                            </div>
                            <span className={stock.momentum >= 0 ? "text-green-400" : "text-red-400"}>
                              {stock.momentum >= 0 ? "RALLY" : "SPIRAL"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-950/80 border-cyan-500/40">
                  <CardHeader>
                    <CardTitle className="flex items-center text-cyan-300 text-lg">
                      <Newspaper className="w-5 h-5 mr-2" /> Market Events & Rumors
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Live feed from media desk + NPC traders reacting to your moves.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[240px] pr-4">
                      <div className="space-y-4">
                        {marketEvents.map((event) => (
                          <div key={event.id} className="p-3 border border-cyan-500/20 rounded-lg bg-black/50">
                            <div className="flex items-center justify-between text-xs text-gray-400">
                              <span>{event.timestamp.toLocaleTimeString()}</span>
                              <Badge className="bg-cyan-600/50 text-cyan-100 text-[10px] uppercase">
                                {event.tone}
                              </Badge>
                            </div>
                            <div className="text-sm text-cyan-100 mt-2 leading-relaxed">{event.title}</div>
                            <p className="text-xs text-gray-400 mt-1">{event.description}</p>
                            {event.affected.length > 0 && (
                              <div className="mt-2 text-xs text-cyan-200">
                                Impacted: {event.affected.join(", ")}
                              </div>
                            )}
                          </div>
                        ))}
                        {marketEvents.length === 0 && (
                          <div className="text-sm text-gray-400 text-center py-6">Rumor desk warming up...</div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="bg-gray-950/80 border-cyan-500/40">
                  <CardHeader>
                    <CardTitle className="flex items-center text-cyan-300 text-lg">
                      <Target className="w-5 h-5 mr-2" /> Quick Trade Console
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Trade on vibes. Influence grows when you nail the cultural beat.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedStock ? (
                      <div className="space-y-4">
                        <div className="p-3 border border-cyan-500/20 rounded-lg bg-black/50">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-lg text-cyan-200 font-bold">{selectedStock.symbol}</div>
                              <div className="text-xs text-gray-400">{selectedStock.name}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg text-cyan-100">${selectedStock.price.toFixed(2)}</div>
                              <Badge variant="outline" className="text-xs mt-1 uppercase">
                                {selectedStock.sentiment}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-xs text-gray-400 mt-2 leading-relaxed">{selectedStock.storyline}</p>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant={orderType === "buy" ? "default" : "outline"}
                            onClick={() => setOrderType("buy")}
                            className={`flex-1 ${orderType === "buy" ? "bg-green-500 hover:bg-green-600" : "border-cyan-500/40"}`}
                          >
                            BUY
                          </Button>
                          <Button
                            variant={orderType === "sell" ? "default" : "outline"}
                            onClick={() => setOrderType("sell")}
                            className={`flex-1 ${orderType === "sell" ? "bg-red-500 hover:bg-red-600" : "border-cyan-500/40"}`}
                          >
                            SELL
                          </Button>
                        </div>

                        <div>
                          <label className="text-xs text-gray-300">Amount ($)</label>
                          <Input
                            type="number"
                            value={orderAmount}
                            onChange={(event) => setOrderAmount(event.target.value)}
                            placeholder="Enter order size"
                            className="bg-black/60 border-cyan-500/30 text-cyan-200"
                          />
                          <div className="text-[10px] text-gray-400 mt-1">
                            ≈{selectedStock.price > 0 ? Math.floor(Number(orderAmount || 0) / selectedStock.price) : 0} shares
                          </div>
                        </div>

                        <Button
                          onClick={handleExecuteOrder}
                          disabled={isExecutingOrder || !orderAmount}
                          className="w-full bg-cyan-500 text-black font-bold hover:bg-cyan-400 disabled:opacity-40"
                        >
                          {isExecutingOrder ? "Routing..." : `Execute ${orderType.toUpperCase()}`}
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center text-gray-400 py-10">
                        <Target className="w-12 h-12 mx-auto mb-3" />
                        Select a ticker to trade.
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-gray-950/80 border-cyan-500/40">
                  <CardHeader>
                    <CardTitle className="flex items-center text-cyan-300 text-lg">
                      <Zap className="w-5 h-5 mr-2" /> Community Impulses
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Trigger cultural events that swing sentiment in seconds.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {COMMUNITY_IMPULSES.map((impulse) => {
                      const cooldown = impulseCooldowns[impulse.id] ?? 0
                      return (
                        <button
                          key={impulse.id}
                          onClick={() => handleImpulse(impulse)}
                          disabled={cooldown > 0}
                          className={`w-full text-left p-4 rounded-lg border transition ${
                            cooldown > 0
                              ? "border-gray-800 text-gray-500"
                              : "border-cyan-500/30 hover:border-cyan-400"
                          } bg-black/40`}
                        >
                          <div className="flex items-center gap-3">
                            <impulse.icon className="w-5 h-5 text-cyan-200" />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-cyan-100 font-semibold">{impulse.label}</span>
                                <Badge className="bg-cyan-600/60 text-black text-[10px]">
                                  {cooldown > 0 ? `${cooldown}s` : "READY"}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-400 mt-1 leading-relaxed">{impulse.description}</p>
                              <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-2">
                                <span><Flame className="w-3 h-3 inline-block mr-1" /> Drama {impulse.effect.drama >= 0 ? "+" : ""}{impulse.effect.drama}</span>
                                <span><Star className="w-3 h-3 inline-block mr-1" /> Influence +{impulse.effect.influence}</span>
                              </div>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </CardContent>
                </Card>

                <Card className="bg-gray-950/80 border-cyan-500/40">
                  <CardHeader>
                    <CardTitle className="flex items-center text-cyan-300 text-lg">
                      <Trophy className="w-5 h-5 mr-2" /> Influence Meter
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Being early, loud, and right amplifies your sway.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-black/60 border border-cyan-500/30 rounded-lg">
                      <div className="text-sm text-cyan-200">Influence Score</div>
                      <div className="text-3xl font-bold text-cyan-100">{influence}</div>
                      <Progress value={clamp((influence % 100) + 20, 0, 100)} className="h-2 bg-gray-800 mt-3" />
                      <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                        Influence multiplies your votes, boosts NPC reaction speed, and unlocks faction rituals.
                      </p>
                    </div>

                    <div className="space-y-3 text-xs text-gray-300">
                      <div className="flex items-center gap-2">
                        <Rocket className="w-3 h-3 text-cyan-200" />
                        Early trades during hype arcs earn +2 influence.
                      </div>
                      <div className="flex items-center gap-2">
                        <Megaphone className="w-3 h-3 text-cyan-200" />
                        Community impulses that land well boost faction respect.
                      </div>
                      <div className="flex items-center gap-2">
                        <Award className="w-3 h-3 text-cyan-200" />
                        Maintain streaks to unlock custom tickers and Prophet titles.
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="portfolio" className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 space-y-6">
                <Card className="bg-gray-950/80 border-cyan-500/40">
                  <CardHeader>
                    <CardTitle className="flex items-center text-cyan-300 text-lg">
                      <PieChart className="w-5 h-5 mr-2" /> Holdings Breakdown
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Track performance by vibes, story arcs, and P&L.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {positions.length === 0 ? (
                      <div className="text-center text-gray-400 py-8">You haven&apos;t shaped the market yet. Execute a trade to leave a mark.</div>
                    ) : (
                      <div className="space-y-4">
                        {positions.map((position) => {
                          const stock = stocks.find((item) => item.symbol === position.symbol)
                          const sentiment = stock?.sentiment ?? "bullish"
                          return (
                            <div key={position.symbol} className="p-4 border border-cyan-500/30 rounded-lg bg-black/50">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-cyan-200 font-semibold">{position.symbol}</div>
                                  <div className="text-xs text-gray-400">Avg ${position.avgPrice.toFixed(2)} · {position.shares} shares</div>
                                </div>
                                <Badge variant="outline" className="uppercase text-xs">{sentiment}</Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-3 mt-3 text-xs text-gray-300">
                                <div>
                                  <div className="text-gray-400">Current Value</div>
                                  <div className="text-cyan-100 font-semibold">${position.currentValue.toFixed(2)}</div>
                                </div>
                                <div>
                                  <div className="text-gray-400">P&L</div>
                                  <div className={position.pnl >= 0 ? "text-green-400" : "text-red-400"}>
                                    {position.pnl >= 0 ? "+" : ""}${position.pnl.toFixed(2)} ({position.pnlPercent >= 0 ? "+" : ""}
                                    {position.pnlPercent.toFixed(1)}%)
                                  </div>
                                </div>
                              </div>
                              {stock && <p className="text-[11px] text-gray-400 mt-3 leading-relaxed">{stock.storyline}</p>}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-gray-950/80 border-cyan-500/40">
                  <CardHeader>
                    <CardTitle className="flex items-center text-cyan-300 text-lg">
                      <MessageCircle className="w-5 h-5 mr-2" /> Action Feed
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Echoes of what you and the community just pulled off.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[260px] pr-4">
                      <div className="space-y-3">
                        {actionFeed.map((item) => (
                          <div key={item.id} className="p-3 border border-cyan-500/20 rounded-lg bg-black/40">
                            <div className="flex items-center justify-between text-[10px] text-gray-400">
                              <span>{item.timestamp.toLocaleTimeString()}</span>
                              <Badge className="bg-cyan-600/40 text-cyan-100 text-[10px] uppercase">{item.type}</Badge>
                            </div>
                            <p className="text-xs text-cyan-100 mt-2 leading-relaxed">{item.text}</p>
                          </div>
                        ))}
                        {actionFeed.length === 0 && (
                          <div className="text-center text-gray-500 py-6 text-sm">Make a move to wake the feed.</div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="bg-gray-950/80 border-cyan-500/40">
                  <CardHeader>
                    <CardTitle className="flex items-center text-cyan-300 text-lg">
                      <Activity className="w-5 h-5 mr-2" /> Performance Snapshot
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs text-gray-300">
                    <div className="flex items-center justify-between">
                      <span>Cash on Hand</span>
                      <span className="text-cyan-100 font-semibold">${cash.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Open Positions</span>
                      <span>{positions.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>XP</span>
                      <span>{player.xp}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Streak</span>
                      <span>{player.streak} days</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-950/80 border-cyan-500/40">
                  <CardHeader>
                    <CardTitle className="flex items-center text-cyan-300 text-lg">
                      <Trophy className="w-5 h-5 mr-2" /> Leaderboard Signal
                    </CardTitle>
                    <CardDescription className="text-gray-400">Top cultural movers right now.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-xs text-gray-300">
                      {leaderboard.slice(0, 5).map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between">
                          <div>
                            <div className="text-cyan-100 font-semibold">{entry.username}</div>
                            <div className="text-[10px] text-gray-500">Lv.{entry.level} · ${entry.totalValue.toLocaleString()}</div>
                          </div>
                          <Badge className="bg-cyan-600/40 text-black text-[10px]">Influence {Math.max(10, entry.level * 3)}</Badge>
                        </div>
                      ))}
                      {leaderboard.length === 0 && (
                        <div className="text-center text-gray-500 py-6">Leaderboard syncing...</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="culture" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card className="bg-gray-950/80 border-cyan-500/40">
                  <CardHeader>
                    <CardTitle className="flex items-center text-cyan-300 text-lg">
                      <Users className="w-5 h-5 mr-2" /> Faction Heat Map
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Choose a clan, coordinate narratives, stage cultural warfare.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {FACTION_HIGHLIGHTS.map((faction) => (
                      <div key={faction.name} className="p-4 border border-cyan-500/20 rounded-lg bg-black/50">
                        <div className="flex items-center gap-2">
                          <faction.icon className="w-5 h-5 text-cyan-200" />
                          <div className="text-cyan-100 font-semibold">{faction.name}</div>
                        </div>
                        <p className="text-xs text-gray-400 mt-2 leading-relaxed">{faction.motto}</p>
                        <p className="text-[11px] text-gray-500 mt-3 leading-relaxed">{faction.focus}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="bg-gray-950/80 border-cyan-500/40">
                  <CardHeader>
                    <CardTitle className="flex items-center text-cyan-300 text-lg">
                      <Swords className="w-5 h-5 mr-2" /> Seasonal Arc Preview
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Weekly anime energy with markets as the battleground.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm text-gray-300 leading-relaxed">
                    <div className="p-4 border border-cyan-500/20 rounded-lg bg-black/40">
                      <h3 className="text-cyan-100 font-semibold">Current Episode: EchoFest or Bust</h3>
                      <p className="text-xs text-gray-400 mt-2">
                        Media team is priming a triple-act drama: leak, backlash, investigation. Your collective decisions rewrite tomorrow&apos;s broadcast.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-gray-400">
                      <div className="p-3 border border-cyan-500/20 rounded-lg bg-black/40">
                        <h4 className="text-cyan-200 font-semibold mb-2">Rumor Simulation</h4>
                        NPC traders now react in under 90 seconds when drama &gt; 70.
                      </div>
                      <div className="p-3 border border-cyan-500/20 rounded-lg bg-black/40">
                        <h4 className="text-cyan-200 font-semibold mb-2">Market Memory</h4>
                        Story decisions bias price direction for the next cycle.
                      </div>
                      <div className="p-3 border border-cyan-500/20 rounded-lg bg-black/40">
                        <h4 className="text-cyan-200 font-semibold mb-2">Spotlight</h4>
                        Media desk will feature top impulse creators in Friday&apos;s Echo Report.
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="bg-gray-950/80 border-cyan-500/40">
                  <CardHeader>
                    <CardTitle className="flex items-center text-cyan-300 text-lg">
                      <Radio className="w-5 h-5 mr-2" /> Media Desk Missions
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Complete beats to earn badges, custom tickers, and lore drops.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs text-gray-300">
                    <div className="p-3 border border-cyan-500/20 rounded-lg bg-black/40">
                      <div className="text-cyan-100 font-semibold">Echo Report Tease</div>
                      <p className="text-[11px] text-gray-400 mt-1">
                        Submit screenshots of your wildest vote coalition for a chance to be canonized.
                      </p>
                    </div>
                    <div className="p-3 border border-cyan-500/20 rounded-lg bg-black/40">
                      <div className="text-cyan-100 font-semibold">Lore Dividend</div>
                      <p className="text-[11px] text-gray-400 mt-1">
                        Influence &gt; 60 unlocks the Market Prophet badge and a custom rumor drop.
                      </p>
                    </div>
                    <div className="p-3 border border-cyan-500/20 rounded-lg bg-black/40">
                      <div className="text-cyan-100 font-semibold">Faction Spotlight</div>
                      <p className="text-[11px] text-gray-400 mt-1">
                        Factions that coordinate three successful impulses in a session get a media feature.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-950/80 border-cyan-500/40">
                  <CardHeader>
                    <CardTitle className="flex items-center text-cyan-300 text-lg">
                      <Gavel className="w-5 h-5 mr-2" /> Weekly Rituals
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Rhythm for the media team to amplify the cultural machine.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs text-gray-300">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-cyan-600/50 text-black text-[10px]">MON</Badge>
                      <span>NPC trader briefing + rumor seeding challenges.</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className="bg-cyan-600/50 text-black text-[10px]">WED</Badge>
                      <span>Community vote recap stream featuring top cultural moves.</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className="bg-cyan-600/50 text-black text-[10px]">FRI</Badge>
                      <span>Echo Report drops. Seasonal lore pivot based on the week&apos;s winners.</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

