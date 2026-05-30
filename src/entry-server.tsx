import './prerender-polyfill'
import { renderToString } from 'react-dom/server'
import { HelmetProvider } from 'react-helmet-async'
import { StaticRouter } from 'react-router-dom'
import App from './App'

export async function prerender({ url }: { url: string }) {
  const helmetContext: any = {}

  const html = renderToString(
    <HelmetProvider context={helmetContext}>
      <StaticRouter location={url}>
        <App />
      </StaticRouter>
    </HelmetProvider>
  )

  const { helmet } = helmetContext

  return {
    html,
    head: {
      title: helmet?.title?.toString() || '',
      lang: 'ko',
      elements: helmet
        ? new Set(
            [helmet.meta?.toString(), helmet.link?.toString()].filter(
              Boolean,
            ),
          )
        : new Set(),
    },
  }
}
