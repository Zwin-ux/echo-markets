// Simple analytics wrapper that can be extended with any analytics service

type Event = {
  name: string
  properties?: Record<string, unknown>
}

export function track(event: string, properties?: Record<string, unknown>) {
  // In production, this would send to your analytics service
  // For now just log to console
  console.log('Analytics:', event, properties)
  
  // Example integration with analytics services:
  // if (window.analytics) {
  //   window.analytics.track(event, properties)
  // }
}

export function identify(userId: string, traits?: Record<string, unknown>) {
  console.log('Analytics - Identify:', userId, traits)
  
  // if (window.analytics) {
  //   window.analytics.identify(userId, traits)
  // }
}

export function page(name: string, properties?: Record<string, unknown>) {
  console.log('Analytics - Page:', name, properties)
  
  // if (window.analytics) {
  //   window.analytics.page(name, properties)
  // }
}
