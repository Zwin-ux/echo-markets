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
  Award,
  CheckCircle2,
  ClipboardList
} from "lucide-react"

import { Input } from "@/components/ui/input"

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

interface PlayOutcome {
  id: string
  type: "vote" | "story" | "trade" | "impulse" | "system"
  headline: string
  detail: string
  nextStep: string
  affected: string[]
  metrics: Array<{
    label: string
    value: string
    tone?: "positive" | "negative" | "neutral"
  }>
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

function signedNumber(value: number) {
  return `${value >= 0 ? "+" : ""}${value}`
}

function formatMoveList(adjustments?: Record<string, number>) {
  const entries = Object.entries(adjustments ?? {})
  if (!entries.length) return "No direct ticker move"

  return entries
    .map(([symbol, shift]) => `${symbol} ${shift >= 0 ? "up" : "down"} ${Math.abs(Math.round(shift * 5 * 10) / 10)}%`)
    .join(" / ")
}

function formatMoney(value: number, maximumFractionDigits = 0) {
  return value.toLocaleString(undefined, {
    maximumFractionDigits,
    minimumFractionDigits: maximumFractionDigits
  })
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
  const [combo, setCombo] = useState<number>(0)
  const [lastOutcome, setLastOutcome] = useState<PlayOutcome>({
    id: "opening-brief",
    type: "system",
    headline: "Run open: shape the tape",
    detail: "Pick a ticker, place a small order, then steer the narrative so the market reacts while your exposure is live.",
    nextStep: "Start with a $500-$1,500 order on the selected ticker.",
    affected: ["SCNDL"],
    metrics: [
      { label: "Objective", value: "Trade + story", tone: "neutral" },
      { label: "Risk", value: "Demo capital", tone: "neutral" }
    ]
  })

  const stocksRef = useRef(stocks)
  const dramaRef = useRef(dramaScore)
  const eventSequenceRef = useRef(0)

  const uniqueId = useCallback((prefix: string) => {
    eventSequenceRef.current += 1
    return `${prefix}-${Date.now()}-${eventSequenceRef.current}`
  }, [])

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

  const selectedHolding = useMemo(
    () => (selectedStock ? positions.find((position) => position.symbol === selectedStock.symbol) : undefined),
    [positions, selectedStock]
  )

  const maxOrderAmount = useMemo(() => {
    if (!selectedStock) return 0

    return orderType === "buy"
      ? Math.max(0, Math.floor(cash))
      : Math.max(0, Math.floor((selectedHolding?.shares ?? 0) * selectedStock.price))
  }, [cash, orderType, selectedHolding, selectedStock])

  const missionSteps = useMemo(() => {
    const madeTrade = positions.length > 0 || actionFeed.some((item) => item.type === "trade")
    const hasStoryAction = actionFeed.some((item) => item.type === "story")
    const hasImpulseAction = actionFeed.some((item) => item.type === "impulse")
    const castVote = totalVotes > 0 || hasStoryAction
    const impulseActive = Object.values(impulseCooldowns).some((cooldown) => cooldown > 0)
    const firedImpulse = impulseActive || hasImpulseAction

    return [
      {
        label: "Open exposure",
        done: madeTrade,
        detail: madeTrade ? `${positions.length || 1} live position${positions.length === 1 ? "" : "s"}` : "Route a small order."
      },
      {
        label: "Steer the beat",
        done: castVote,
        detail: castVote
          ? totalVotes > 0
            ? `${totalVotes} vote${totalVotes === 1 ? "" : "s"} on this arc`
            : "Story beat already moved."
          : "Vote before the timer clears."
      },
      {
        label: "Move sentiment",
        done: firedImpulse,
        detail: firedImpulse
          ? impulseActive
            ? "Impulse active on the tape."
            : "Impulse already hit the tape."
          : "Trigger one community impulse."
      }
    ]
  }, [actionFeed, impulseCooldowns, positions.length, totalVotes])

  const completedMissionSteps = missionSteps.filter((step) => step.done).length
  const nextMissionStep = missionSteps.find((step) => !step.done)
  const controlScore = Math.round(
    clamp((completedMissionSteps / missionSteps.length) * 55 + Math.min(influence, 100) * 0.25 + Math.min(totalVotes * 4, 20), 0, 100)
  )

  const registerAction = useCallback((item: ActionFeedItem) => {
    setActionFeed((prev) => [item, ...prev].slice(0, 12))
  }, [])

  const pushNotification = useCallback((message: string) => {
    setNotifications((prev) => [message, ...prev].slice(0, 6))
  }, [])

  const setQuickOrderAmount = useCallback((amount: number) => {
    setOrderAmount(amount > 0 ? String(amount) : "")
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
          id: uniqueId("rumor"),
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
      setCombo((prev) => prev + 1)
      setLastOutcome({
        id: uniqueId("story-outcome"),
        type: "story",
        headline: `Beat resolved: ${option.label}`,
        detail: option.effect.rumor ?? `${currentBeat.title} resolved and pushed the market into a new beat.`,
        nextStep: "Trade the moved tickers or fire an impulse before momentum decays.",
        affected: Object.keys(option.effect.momentumShift ?? {}),
        metrics: [
          { label: "Drama", value: signedNumber(option.effect.drama), tone: option.effect.drama >= 0 ? "positive" : "negative" },
          { label: "Influence", value: `+${option.effect.influence}`, tone: "positive" },
          { label: "Tape move", value: formatMoveList(option.effect.momentumShift), tone: "neutral" }
        ]
      })

      registerAction({
        id: uniqueId("story"),
        type: "story",
        text: `Community steered the arc: ${option.label}. Influence ripples through the floor.`,
        timestamp
      })

      pushNotification(`Story advanced: ${currentBeat.title} -> ${option.label}`)

      setCommunityVotes({})
      setVoteTimer(VOTE_DURATION)

      if (option.nextBeat) {
        setCurrentBeatId(option.nextBeat)
      } else {
        const fallback = STORY_BEATS[Math.floor(Math.random() * STORY_BEATS.length)]
        setCurrentBeatId(fallback.id)
      }
    },
    [applyStockMomentum, currentBeat, pushNotification, registerAction, uniqueId]
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
      const nextVoteCount = (communityVotes[option.id] ?? 0) + 1
      const nextTotalVotes = totalVotes + 1
      const voteShare = Math.round((nextVoteCount / nextTotalVotes) * 100)

      setCommunityVotes((prev) => ({
        ...prev,
        [option.id]: nextVoteCount
      }))

      setInfluence((prev) => prev + 1)
      setLastOutcome({
        id: uniqueId("vote-outcome"),
        type: "vote",
        headline: `Vote locked: ${option.label}`,
        detail: `${voteShare}% of current votes now point here. If this wins, ${formatMoveList(option.effect.momentumShift).toLowerCase()}.`,
        nextStep: "Open or adjust exposure before the vote timer resolves.",
        affected: Object.keys(option.effect.momentumShift ?? {}),
        metrics: [
          { label: "Current share", value: `${voteShare}%`, tone: "neutral" },
          { label: "Drama", value: signedNumber(option.effect.drama), tone: option.effect.drama >= 0 ? "positive" : "negative" },
          { label: "Influence", value: "+1 now", tone: "positive" }
        ]
      })

      registerAction({
        id: uniqueId("vote"),
        type: "story",
        text: `You cast your vote for "${option.label}". Narrative gravity shifts.`,
        timestamp: new Date()
      })
    },
    [communityVotes, registerAction, totalVotes, uniqueId]
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
      setCombo((prev) => prev + 1)
      setImpulseCooldowns((prev) => ({ ...prev, [impulse.id]: impulse.cooldown }))
      setLastOutcome({
        id: uniqueId("impulse-outcome"),
        type: "impulse",
        headline: `Impulse fired: ${impulse.label}`,
        detail: `${impulse.effect.sentiment.toUpperCase()} sentiment is now active. ${formatMoveList(impulse.effect.boost)}.`,
        nextStep: "Use the cooldown window to trade the affected ticker or vote the next beat.",
        affected: Object.keys(impulse.effect.boost ?? {}),
        metrics: [
          { label: "Drama", value: signedNumber(impulse.effect.drama), tone: impulse.effect.drama >= 0 ? "positive" : "negative" },
          { label: "Influence", value: `+${impulse.effect.influence}`, tone: "positive" },
          { label: "Cooldown", value: `${impulse.cooldown}s`, tone: "neutral" }
        ]
      })

      const event: MarketEvent = {
        id: uniqueId("impulse"),
        title: `${impulse.label} detonated`,
        description: impulse.description,
        tone: impulse.effect.sentiment === "panic" ? "panic" : "hype",
        impact: impulse.effect.drama / 10,
        affected: Object.keys(impulse.effect.boost ?? {}),
        timestamp
      }

      setMarketEvents((prev) => [event, ...prev].slice(0, 8))

      registerAction({
        id: uniqueId("impulse-action"),
        type: "impulse",
        text: `${impulse.label} ripples through the pit. ${impulse.effect.sentiment.toUpperCase()} spreads.`,
        timestamp
      })
    },
    [applyStockMomentum, impulseCooldowns, pushNotification, registerAction, uniqueId]
  )

  const handleExecuteOrder = useCallback(async (amountOverride?: number) => {
    if (!selectedStock) return
    const numericAmount = amountOverride ?? Number(orderAmount)
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return
    const estimatedShares = Math.floor(numericAmount / selectedStock.price)
    const timestamp = new Date()

    if (estimatedShares <= 0) {
      setLastOutcome({
        id: uniqueId("trade-reject"),
        type: "trade",
        headline: "Order rejected: size too small",
        detail: `${selectedStock.symbol} is trading at $${selectedStock.price.toFixed(2)}. The order needs enough cash to buy or sell at least one share.`,
        nextStep: `Raise the order above $${Math.ceil(selectedStock.price)} or pick a cheaper ticker.`,
        affected: [selectedStock.symbol],
        metrics: [
          { label: "Order size", value: `$${numericAmount.toFixed(0)}`, tone: "negative" },
          { label: "Shares", value: "0", tone: "negative" }
        ]
      })
      pushNotification("Order rejected: size too small")
      return
    }

    if (orderType === "buy" && numericAmount > cash) {
      setLastOutcome({
        id: uniqueId("trade-reject"),
        type: "trade",
        headline: "Order rejected: cash limit",
        detail: `You tried to route $${numericAmount.toFixed(0)} with $${cash.toFixed(0)} cash available.`,
        nextStep: "Use a smaller quick size or sell an existing position first.",
        affected: [selectedStock.symbol],
        metrics: [
          { label: "Cash", value: `$${cash.toFixed(0)}`, tone: "neutral" },
          { label: "Requested", value: `$${numericAmount.toFixed(0)}`, tone: "negative" }
        ]
      })
      pushNotification("Order rejected: cash limit")
      return
    }

    if (orderType === "sell" && (!selectedHolding || selectedHolding.shares < estimatedShares)) {
      setLastOutcome({
        id: uniqueId("trade-reject"),
        type: "trade",
        headline: "Order rejected: no borrow in demo",
        detail: `You hold ${selectedHolding?.shares ?? 0} ${selectedStock.symbol} shares and tried to sell about ${estimatedShares}.`,
        nextStep: "Buy the ticker first, or sell a smaller amount from an existing holding.",
        affected: [selectedStock.symbol],
        metrics: [
          { label: "Held", value: `${selectedHolding?.shares ?? 0}`, tone: "neutral" },
          { label: "Sell request", value: `${estimatedShares}`, tone: "negative" }
        ]
      })
      pushNotification("Order rejected: no shares available")
      return
    }

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
        pushNotification(`Trade failed: ${payload.error ?? "Unknown error"}`)
        setLastOutcome({
          id: uniqueId("trade-failed"),
          type: "trade",
          headline: "Order failed",
          detail: payload.error ?? "The order service did not return a fill.",
          nextStep: "Try a smaller order or switch tickers.",
          affected: [selectedStock.symbol],
          metrics: [{ label: "Status", value: "Rejected", tone: "negative" }]
        })
        return
      }

      const trade = payload.data.trade
      const rewards = payload.data.rewards
      const marketImpact = Number(payload.data.marketImpact ?? 0)
      const positionAfter =
        orderType === "buy"
          ? (selectedHolding?.shares ?? 0) + trade.shares
          : Math.max(0, (selectedHolding?.shares ?? 0) - trade.shares)
      const cashAfter = orderType === "buy" ? cash - trade.totalCost : cash + trade.totalCost

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
      setCombo((prev) => prev + 1)
      setLastOutcome({
        id: `trade-outcome-${trade.orderId}`,
        type: "trade",
        headline: `Order filled: ${orderType.toUpperCase()} ${trade.shares} ${selectedStock.symbol}`,
        detail: `${selectedStock.name} filled at $${trade.executedPrice.toFixed(2)}. Position after fill: ${positionAfter} shares.`,
        nextStep:
          orderType === "buy"
            ? "Now steer the story or fire an impulse so the position has a reason to move."
            : "Reallocate cash into the next ticker that reacts to the story beat.",
        affected: [selectedStock.symbol],
        metrics: [
          { label: "Fill", value: `$${trade.totalCost.toFixed(0)}`, tone: "neutral" },
          { label: "Cash after", value: `$${cashAfter.toFixed(0)}`, tone: cashAfter >= 0 ? "positive" : "negative" },
          { label: "XP", value: `+${rewards.xpGained}`, tone: "positive" },
          { label: "Impact", value: `${(marketImpact * 100).toFixed(1)}%`, tone: "neutral" }
        ]
      })

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
      pushNotification("Trade failed: network error")
      setLastOutcome({
        id: uniqueId("trade-network"),
        type: "trade",
        headline: "Order failed: network",
        detail: "The client could not reach the trade route.",
        nextStep: "Retry once. If it repeats, stay in demo mode and use narrative actions.",
        affected: selectedStock ? [selectedStock.symbol] : [],
        metrics: [{ label: "Status", value: "Network error", tone: "negative" }]
      })
    } finally {
      setIsExecutingOrder(false)
    }
  }, [cash, orderAmount, orderType, player.id, pushNotification, registerAction, selectedHolding, selectedStock, uniqueId])

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
          id: uniqueId("ambient"),
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
        id: uniqueId("ambient-action"),
        type: "system",
        text: `Rumor ticker pinged ${affected.symbol}.`,
        timestamp
      })
    }, 22000)

    return () => clearInterval(interval)
  }, [registerAction, uniqueId])

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
    <div className="arcade-stage min-h-screen overflow-hidden text-[#fff2b8]">
      <div className="arcade-scanline" aria-hidden="true" />
      <main className="relative mx-auto w-full max-w-[1500px] px-2 py-3 sm:px-4 sm:py-5">
        <section className="arcade-cabinet">
          <header className="arcade-marquee">
            <div className="flex min-w-0 items-center gap-3">
              <div className="arcade-mark">
                <Image src="/echo-mark.svg" alt="Echo Markets" width={36} height={36} />
              </div>
              <div className="min-w-0">
                <div className="arcade-kicker">Culture Exchange Cabinet</div>
                <h1 className="arcade-title">Echo Markets</h1>
              </div>
            </div>
            <div className="arcade-scoreboard" aria-label="player status">
              <div>
                <span>Rank</span>
                <strong>#{player.rank}</strong>
              </div>
              <div>
                <span>Level</span>
                <strong>{player.level}</strong>
              </div>
              <div>
                <span>Bank</span>
                <strong>${formatMoney(portfolioValue)}</strong>
              </div>
              <div>
                <span>Today</span>
                <strong className={player.dayChange >= 0 ? "arcade-good" : "arcade-bad"}>
                  {player.dayChange >= 0 ? "+" : ""}${formatMoney(player.dayChange, 2)}
                </strong>
              </div>
            </div>
          </header>

          <div className="arcade-ticker" aria-label="live market ticker">
            <span>LIVE TAPE</span>
            {stocks.map((stock) => (
              <button
                key={`ticker-${stock.symbol}`}
                type="button"
                onClick={() => setSelectedStock(stock)}
                className={selectedStock?.symbol === stock.symbol ? "is-active" : ""}
              >
                {stock.symbol} ${stock.price.toFixed(2)} {stock.changePercent >= 0 ? "+" : "-"}
                {Math.abs(stock.changePercent).toFixed(1)}%
              </button>
            ))}
          </div>

          <nav className="arcade-modebar" aria-label="cabinet modes">
            {[
              { id: "loop", label: "Play Field", icon: BarChart3 },
              { id: "portfolio", label: "Bank Roll", icon: PieChart },
              { id: "culture", label: "Lore Board", icon: Users }
            ].map((mode) => {
              const Icon = mode.icon
              const active = activeTab === mode.id
              return (
                <button
                  key={mode.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setActiveTab(mode.id as typeof activeTab)}
                  className={active ? "is-active" : ""}
                >
                  <Icon className="h-4 w-4" />
                  {mode.label}
                </button>
              )
            })}
          </nav>

          {activeTab === "loop" && (
            <div className="arcade-playfield">
              <section className="arcade-screen">
                <div className="arcade-screen-head">
                  <div>
                    <span className="arcade-kicker">Round Objective</span>
                    <h2>Buy the rumor. Bend the tape.</h2>
                  </div>
                  <div className="arcade-control-score">
                    <span>Control</span>
                    <strong>{controlScore}</strong>
                  </div>
                </div>

                <div className="arcade-mission-lamps">
                  {missionSteps.map((step, index) => (
                    <div key={step.label} className={step.done ? "is-done" : ""}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <strong>{step.label}</strong>
                      <p>{step.detail}</p>
                      {step.done ? <CheckCircle2 className="h-4 w-4" /> : <span className="arcade-lamp" />}
                    </div>
                  ))}
                </div>

                <div className="arcade-result-strip">
                  <div>
                    <span className="arcade-kicker">Last Result</span>
                    <h3>{lastOutcome.headline}</h3>
                    <p>{lastOutcome.detail}</p>
                  </div>
                  <div className="arcade-result-metrics">
                    {lastOutcome.metrics.map((metric) => (
                      <div key={`${lastOutcome.id}-${metric.label}`}>
                        <span>{metric.label}</span>
                        <strong className={metric.tone === "positive" ? "arcade-good" : metric.tone === "negative" ? "arcade-bad" : ""}>
                          {metric.value}
                        </strong>
                      </div>
                    ))}
                    <div>
                      <span>Combo</span>
                      <strong>{combo}</strong>
                    </div>
                  </div>
                  <div className="arcade-affected">
                    <span>Target</span>
                    {(lastOutcome.affected.length ? lastOutcome.affected : ["none"]).map((symbol) => (
                      <b key={`${lastOutcome.id}-${symbol}`}>{symbol}</b>
                    ))}
                    {nextMissionStep && <em>Next: {nextMissionStep.label}</em>}
                  </div>
                </div>

                <div className="arcade-main-grid">
                  <section className="arcade-story-board">
                    <div className="arcade-panel-title">
                      <div>
                        <span className="arcade-kicker">Story Battle</span>
                        <h3>{currentBeat.title}</h3>
                      </div>
                      <div className="arcade-clock">
                        <Timer className="h-4 w-4" />
                        {voteTimer}s
                        <Users className="h-4 w-4" />
                        {totalVotes}
                      </div>
                    </div>
                    <p>{currentBeat.synopsis}</p>
                    <div className="arcade-tags">
                      <span>{currentBeat.mood}</span>
                      {currentBeat.tags.map((tag) => (
                        <span key={tag}>#{tag}</span>
                      ))}
                    </div>
                    <div className="arcade-choice-grid">
                      {currentBeat.options.map((option, index) => {
                        const votes = communityVotes[option.id] ?? 0
                        const share = totalVotes ? Math.round((votes / totalVotes) * 100) : 0
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => handleVote(option)}
                            className="arcade-choice"
                          >
                            <span className="arcade-choice-key">P{index + 1}</span>
                            <strong>{option.label}</strong>
                            <p>{option.description}</p>
                            <div className="arcade-choice-stats">
                              <span>Drama {signedNumber(option.effect.drama)}</span>
                              <span>Influence +{option.effect.influence}</span>
                              <span>{votes} votes</span>
                            </div>
                            <div className="arcade-choice-bar">
                              <i style={{ width: `${share}%` }} />
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </section>

                  <section className="arcade-market-board">
                    <div className="arcade-panel-title">
                      <div>
                        <span className="arcade-kicker">Market Lanes</span>
                        <h3>Emotion-priced tickers</h3>
                      </div>
                      <div className="arcade-market-stats">
                        <span>Drama {Math.round(dramaScore)}</span>
                        <span className="arcade-good">Up {stocks.filter((stock) => stock.changePercent > 0).length}</span>
                        <span className="arcade-bad">Down {stocks.filter((stock) => stock.changePercent < 0).length}</span>
                      </div>
                    </div>
                    <div className="arcade-stock-list">
                      {stocks.map((stock) => (
                        <button
                          key={stock.symbol}
                          type="button"
                          onClick={() => setSelectedStock(stock)}
                          className={selectedStock?.symbol === stock.symbol ? "is-active" : ""}
                        >
                          <span className="arcade-symbol">{stock.symbol}</span>
                          <span className="arcade-stock-name">{stock.name}</span>
                          <span className="arcade-sector">{stock.sector}</span>
                          <span className="arcade-price">${stock.price.toFixed(2)}</span>
                          <span className={stock.changePercent >= 0 ? "arcade-good" : "arcade-bad"}>
                            {stock.changePercent >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                            {Math.abs(stock.changePercent).toFixed(2)}%
                          </span>
                          <span className="arcade-momentum">
                            <i style={{ width: `${clamp(Math.abs(stock.momentum) * 50, 8, 100)}%` }} />
                            {stock.momentum >= 0 ? "RALLY" : "SPIRAL"}
                          </span>
                        </button>
                      ))}
                    </div>
                  </section>
                </div>

                <section className="arcade-rumor-feed">
                  <div className="arcade-panel-title">
                    <div>
                      <span className="arcade-kicker">Rumor Feed</span>
                      <h3>Cabinet broadcast</h3>
                    </div>
                  </div>
                  <div className="arcade-feed-row">
                    {marketEvents.length === 0 ? (
                      <p>Rumor desk warming up...</p>
                    ) : (
                      marketEvents.slice(0, 4).map((event) => (
                        <article key={event.id}>
                          <span>{event.timestamp.toLocaleTimeString()}</span>
                          <strong>{event.title}</strong>
                          <p>{event.description}</p>
                          {event.affected.length > 0 && <em>{event.affected.join(" / ")}</em>}
                        </article>
                      ))
                    )}
                  </div>
                </section>
              </section>

              <aside className="arcade-control-deck">
                <section className="arcade-stick-panel">
                  <div className="arcade-panel-title">
                    <div>
                      <span className="arcade-kicker">Player One</span>
                      <h3>Trade Deck</h3>
                    </div>
                    <Target className="h-5 w-5" />
                  </div>

                  {selectedStock ? (
                    <div className="arcade-selected-stock">
                      <div className="arcade-stock-card">
                        <div>
                          <strong>{selectedStock.symbol}</strong>
                          <span>{selectedStock.name}</span>
                        </div>
                        <div>
                          <strong>${selectedStock.price.toFixed(2)}</strong>
                          <span>{selectedStock.sentiment}</span>
                        </div>
                      </div>
                      <p>{selectedStock.storyline}</p>
                      <div className="arcade-bank-grid">
                        <div>
                          <span>Cash</span>
                          <strong>${formatMoney(cash)}</strong>
                        </div>
                        <div>
                          <span>Held</span>
                          <strong>{selectedHolding?.shares ?? 0}</strong>
                        </div>
                        <div>
                          <span>XP</span>
                          <strong>{player.xp}</strong>
                        </div>
                        <div>
                          <span>Influence</span>
                          <strong>{influence}</strong>
                        </div>
                      </div>

                      <div className="arcade-buy-sell">
                        <button type="button" onClick={() => setOrderType("buy")} className={orderType === "buy" ? "is-active buy" : "buy"}>
                          BUY
                        </button>
                        <button type="button" onClick={() => setOrderType("sell")} className={orderType === "sell" ? "is-active sell" : "sell"}>
                          SELL
                        </button>
                      </div>

                      <label className="arcade-input-label" htmlFor="order-size">Order size</label>
                      <Input
                        id="order-size"
                        type="number"
                        value={orderAmount}
                        onChange={(event) => setOrderAmount(event.target.value)}
                        placeholder="Type custom stake"
                        className="arcade-input"
                      />
                      <div className="arcade-share-estimate">
                        Est. {selectedStock.price > 0 ? Math.floor(Number(orderAmount || 0) / selectedStock.price) : 0} shares
                      </div>

                      <div className="arcade-coin-grid">
                        {[500, 1500, 3000].map((amount) => {
                          const sellCapacity = (selectedHolding?.shares ?? 0) * selectedStock.price
                          const disabled = isExecutingOrder || (orderType === "buy" ? cash < amount : sellCapacity < amount)
                          return (
                            <button
                              key={amount}
                              type="button"
                              disabled={disabled}
                              onPointerDown={() => setQuickOrderAmount(amount)}
                              onClick={() => setQuickOrderAmount(amount)}
                            >
                              <span>Coin</span>
                              ${formatMoney(amount)}
                            </button>
                          )
                        })}
                        <button
                          type="button"
                          disabled={maxOrderAmount <= 0 || isExecutingOrder}
                          onPointerDown={() => setQuickOrderAmount(maxOrderAmount)}
                          onClick={() => setQuickOrderAmount(maxOrderAmount)}
                        >
                          <span>Coin</span>
                          Max
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => void handleExecuteOrder()}
                        disabled={isExecutingOrder || !orderAmount.trim()}
                        className="arcade-action-button"
                      >
                        {isExecutingOrder ? "Routing..." : `Punch ${orderType.toUpperCase()}`}
                      </button>
                    </div>
                  ) : (
                    <div className="arcade-empty">Select a ticker on the playfield.</div>
                  )}
                </section>

                <section className="arcade-specials">
                  <div className="arcade-panel-title">
                    <div>
                      <span className="arcade-kicker">Special Moves</span>
                      <h3>Impulse buttons</h3>
                    </div>
                    <Zap className="h-5 w-5" />
                  </div>
                  {COMMUNITY_IMPULSES.map((impulse) => {
                    const cooldown = impulseCooldowns[impulse.id] ?? 0
                    return (
                      <button
                        key={impulse.id}
                        type="button"
                        onClick={() => handleImpulse(impulse)}
                        disabled={cooldown > 0}
                      >
                        <impulse.icon className="h-5 w-5" />
                        <span>
                          <strong>{impulse.label}</strong>
                          <em>{impulse.description}</em>
                        </span>
                        <b>{cooldown > 0 ? `${cooldown}s` : "Ready"}</b>
                      </button>
                    )
                  })}
                </section>
              </aside>
            </div>
          )}

          {activeTab === "portfolio" && (
            <div className="arcade-ledger-grid">
              <section className="arcade-screen">
                <div className="arcade-screen-head">
                  <div>
                    <span className="arcade-kicker">Bank Roll</span>
                    <h2>Holdings and action tape</h2>
                  </div>
                  <div className="arcade-control-score">
                    <span>Cash</span>
                    <strong>${formatMoney(cash)}</strong>
                  </div>
                </div>
                <div className="arcade-ledger-columns">
                  <div className="arcade-ledger-panel">
                    <h3>Open positions</h3>
                    {positions.length === 0 ? (
                      <p>No live exposure. Punch a coin on the playfield.</p>
                    ) : (
                      positions.map((position) => {
                        const stock = stocks.find((item) => item.symbol === position.symbol)
                        return (
                          <article key={position.symbol}>
                            <strong>{position.symbol}</strong>
                            <span>{position.shares} shares at ${position.avgPrice.toFixed(2)}</span>
                            <b className={position.pnl >= 0 ? "arcade-good" : "arcade-bad"}>
                              {position.pnl >= 0 ? "+" : ""}${position.pnl.toFixed(2)}
                            </b>
                            {stock && <p>{stock.storyline}</p>}
                          </article>
                        )
                      })
                    )}
                  </div>
                  <div className="arcade-ledger-panel">
                    <h3>Action tape</h3>
                    {actionFeed.length === 0 ? (
                      <p>Make a move to wake the tape.</p>
                    ) : (
                      actionFeed.slice(0, 8).map((item) => (
                        <article key={item.id}>
                          <strong>{item.type}</strong>
                          <span>{item.timestamp.toLocaleTimeString()}</span>
                          <p>{item.text}</p>
                        </article>
                      ))
                    )}
                  </div>
                  <div className="arcade-ledger-panel">
                    <h3>Cabinet leaderboard</h3>
                    {leaderboard.length === 0 ? (
                      <p>Leaderboard syncing...</p>
                    ) : (
                      leaderboard.slice(0, 6).map((entry) => (
                        <article key={entry.id}>
                          <strong>{entry.username}</strong>
                          <span>Lv.{entry.level} // ${formatMoney(entry.totalValue)}</span>
                          <b>#{entry.rank}</b>
                        </article>
                      ))
                    )}
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === "culture" && (
            <div className="arcade-ledger-grid">
              <section className="arcade-screen">
                <div className="arcade-screen-head">
                  <div>
                    <span className="arcade-kicker">Lore Board</span>
                    <h2>Factions, rituals, and seasonal heat</h2>
                  </div>
                  <div className="arcade-control-score">
                    <span>Drama</span>
                    <strong>{Math.round(dramaScore)}</strong>
                  </div>
                </div>
                <div className="arcade-lore-grid">
                  {FACTION_HIGHLIGHTS.map((faction) => (
                    <article key={faction.name}>
                      <faction.icon className="h-5 w-5" />
                      <strong>{faction.name}</strong>
                      <p>{faction.motto}</p>
                      <em>{faction.focus}</em>
                    </article>
                  ))}
                  <article>
                    <Radio className="h-5 w-5" />
                    <strong>Echo Report</strong>
                    <p>Friday broadcast pivots from the strongest community move.</p>
                    <em>Influence above 60 unlocks a custom rumor drop.</em>
                  </article>
                  <article>
                    <Swords className="h-5 w-5" />
                    <strong>Current Episode</strong>
                    <p>EchoFest leak, backlash, investigation. Markets are the battleground.</p>
                    <em>Win the story before the ticker catches up.</em>
                  </article>
                </div>
              </section>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
