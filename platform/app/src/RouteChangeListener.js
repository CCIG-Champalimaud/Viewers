import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

function RouteChangeListener() {
  const location = useLocation()

  useEffect(() => {
    // complete url after navigation
    const url = window.location.href
    // ohif routing
    const route = location.pathname
    // extract eventual query paramenters
    const queryParams = Object.fromEntries(new URLSearchParams(location.search))
    // loading dynamic config from parent app will include ohifId which is unique for each iframe
    const ohifId = window.config.ohifId
    // dispatch an event to the parent window
    window.parent.postMessage(
      {
        type: 'ROUTE_CHANGE',
        payload: {
          url,
          route,
          queryParams,
          ohifId: ohifId
        }
      },
      '*' // we can specify the target origin for security, like 'https://your-domain.com'
    )

  }, [location]) // trigger on route change
  return null // no need to render anything
}

export default RouteChangeListener
