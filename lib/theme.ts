// Professional trading UI color palette
export const colors = {
  background: {
    primary: '#0a0a0a', // gray-950
    secondary: '#171717', // gray-900
    tertiary: '#262626', // gray-800
  },
  text: {
    primary: '#f5f5f5', // gray-100
    secondary: '#d4d4d4', // gray-300
    disabled: '#737373', // gray-500
  },
  accents: {
    primary: '#3b82f6', // blue-500
    positive: '#22c55e', // green-500
    negative: '#ef4444', // red-500
    warning: '#f59e0b', // amber-500
    info: '#0ea5e9', // sky-500
  },
  charts: {
    bullish: '#10b981', // emerald-500
    bearish: '#ef4444', // red-500
    volume: '#6366f1', // indigo-500
    indicators: '#8b5cf6', // violet-500
  },
  states: {
    hover: '#3f3f46', // zinc-700
    active: '#52525b', // zinc-600
    selected: '#3b82f6', // blue-500
  }
}

export const typography = {
  fontFamily: 'Inter, sans-serif',
  sizes: {
    base: '1rem', // 16px
    sm: '0.875rem', // 14px
    lg: '1.125rem', // 18px
    xl: '1.25rem', // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
  },
  weights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeights: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  }
}
