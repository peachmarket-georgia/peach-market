import mixpanel from 'mixpanel-browser'

const MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN

// Initialize Mixpanel
if (MIXPANEL_TOKEN) {
  mixpanel.init(MIXPANEL_TOKEN, {
    debug: process.env.NODE_ENV === 'development',
    track_pageview: true,
    persistence: 'localStorage',
  })
}

// Track events
export const trackEvent = (
  eventName: string,
  properties?: Record<string, unknown>
) => {
  if (!MIXPANEL_TOKEN) return

  mixpanel.track(eventName, properties)
}

// Identify user
export const identifyUser = (
  userId: string,
  properties?: Record<string, unknown>
) => {
  if (!MIXPANEL_TOKEN) return

  mixpanel.identify(userId)
  if (properties) {
    mixpanel.people.set(properties)
  }
}

// Set user properties
export const setUserProperties = (properties: Record<string, unknown>) => {
  if (!MIXPANEL_TOKEN) return

  mixpanel.people.set(properties)
}

// Track page view
export const trackPageView = (
  pageName: string,
  properties?: Record<string, unknown>
) => {
  if (!MIXPANEL_TOKEN) return

  mixpanel.track_pageview({
    page: pageName,
    ...properties,
  })
}

// Reset user (on logout)
export const resetUser = () => {
  if (!MIXPANEL_TOKEN) return

  mixpanel.reset()
}

// Export mixpanel instance for advanced usage
export { mixpanel }
