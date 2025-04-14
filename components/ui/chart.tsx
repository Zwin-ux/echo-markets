import type React from "react"

export const ChartContainer = ({ children }: { children: React.ReactNode }) => {
  return <div className="chart-container">{children}</div>
}

export const Chart = ({ children }: { children: React.ReactNode }) => {
  return <div className="chart">{children}</div>
}

export const Line = () => {
  return null
}

export const LineChart = ({ data, children }: { data: any[]; children: React.ReactNode }) => {
  return <div className="line-chart">{children}</div>
}

export const XAxis = ({ dataKey }: { dataKey: string }) => {
  return null
}

export const YAxis = () => {
  return null
}

export const ChartTooltip = ({ children }: { children: React.ReactNode }) => {
  return <div className="chart-tooltip">{children}</div>
}

export const ChartTooltipContent = () => {
  return <div className="chart-tooltip-content"></div>
}
