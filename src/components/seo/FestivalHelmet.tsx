import { Helmet } from 'react-helmet-async'

const BASE_URL = 'https://festrecipe.com'

interface FestivalHelmetProps {
  festivalId: string
  festivalName: string
  description: string
  startDate: string
  endDate: string
  location: string
  artistCount: number
}

export default function FestivalHelmet({
  festivalId,
  festivalName,
  description,
  startDate,
  endDate,
  location,
  artistCount,
}: FestivalHelmetProps) {
  const title = `${festivalName} — 예상 셋리스트 | FestRecipe`
  const desc = `${festivalName}(${startDate} ~ ${endDate}, ${location}) ${artistCount}개 팀 출연. 아티스트별 AI 예상 셋리스트를 유튜브로 바로 들어보세요.`
  const url = BASE_URL + `/festival/${festivalId}`

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={desc} />

      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={desc} />
      <meta property="og:image" content={BASE_URL + '/og-default.jpg'} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content="ko_KR" />

      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={desc} />
      <meta property="twitter:image" content={BASE_URL + '/og-default.jpg'} />

      <link rel="canonical" href={url} />

      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'MusicEvent',
          name: festivalName,
          description,
          startDate,
          endDate,
          location: {
            '@type': 'Place',
            name: location,
          },
          url,
          inLanguage: 'ko',
          organizer: {
            '@type': 'Organization',
            name: 'FestRecipe',
            url: BASE_URL,
          },
        })}
      </script>

      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'FestRecipe',
              item: BASE_URL,
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: '페스티벌',
              item: BASE_URL + '/',
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: festivalName,
              item: url,
            },
          ],
        })}
      </script>
    </Helmet>
  )
}
