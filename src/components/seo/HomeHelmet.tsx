import { Helmet } from 'react-helmet-async'

const BASE_URL = 'https://festrecipe.com'

interface HomeHelmetProps {
  festivalCount: number
}

export default function HomeHelmet({ festivalCount }: HomeHelmetProps) {
  const title = 'FestRecipe — 페스티벌 라인업 & 대표곡'
  const description = `페스티벌 라인업 아티스트의 대표곡을 YouTube에서 미리 들어 보세요. 현재 ${festivalCount}개 페스티벌 등록됨.`
  const url = BASE_URL + '/'

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />

      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={BASE_URL + '/og-default.jpg'} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content="ko_KR" />

      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={BASE_URL + '/og-default.jpg'} />

      <link rel="canonical" href={url} />

      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'FestRecipe',
          alternateName: '페스티벌 대표곡 플레이리스트',
          url: BASE_URL,
          description: '페스티벌 라인업 아티스트의 대표곡을 YouTube에서 미리 들어 보세요',
          publisher: {
            '@type': 'Organization',
            name: 'FestRecipe',
          },
          inLanguage: 'ko',
        })}
      </script>
    </Helmet>
  )
}
