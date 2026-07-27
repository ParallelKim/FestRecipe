/**
 * artists.json 공식 표기명 동기화
 * YTM(playlist.ytmArtist.name) + 정책(src/lib/artistOfficialName.ts) 적용
 *
 * Usage: node --experimental-strip-types scripts/sync-official-artist-names.mts
 *    or: npx tsx scripts/sync-official-artist-names.mts
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import {
  OFFICIAL_NAME_OVERRIDES,
  resolveOfficialArtistName,
} from '../src/lib/artistOfficialName.ts'

const root = join(import.meta.dirname, '..')
const artistsPath = join(root, 'public/data/artists.json')
const playlistsDir = join(root, 'public/data/playlists')

const artists = JSON.parse(readFileSync(artistsPath, 'utf8')) as Array<Record<string, unknown>>

const ytmById = new Map<string, string>()
for (const file of readdirSync(playlistsDir)) {
  if (!file.endsWith('.json') || file === 'index.json') continue
  const doc = JSON.parse(readFileSync(join(playlistsDir, file), 'utf8'))
  const id = doc.artistId as string
  const ytm = doc?.ytmArtist?.name as string | undefined
  if (id && ytm) ytmById.set(id, ytm)
}

const report: Array<{ id: string; from: string; to: string; source: string; ytm?: string }> = []

for (const artist of artists) {
  const id = artist.id as string
  const prev = String(artist.name || '')
  const ytmName = ytmById.get(id) || (artist.ytmName as string | undefined) || null
  const resolved = resolveOfficialArtistName({
    id,
    name: prev,
    englishName: artist.englishName as string | undefined,
    ytmName,
  })

  artist.name = resolved.name
  if (ytmName) artist.ytmName = ytmName
  artist.nameSource = resolved.source

  if (prev !== resolved.name || OFFICIAL_NAME_OVERRIDES[id]) {
    report.push({
      id,
      from: prev,
      to: resolved.name,
      source: resolved.source,
      ytm: ytmName || undefined,
    })
  }

  // playlist artistName 동기화
  const plPath = join(playlistsDir, `${id}.json`)
  try {
    const pl = JSON.parse(readFileSync(plPath, 'utf8'))
    pl.artistName = resolved.name
    writeFileSync(plPath, `${JSON.stringify(pl, null, 2)}\n`)
  } catch {
    // no playlist file
  }
}

writeFileSync(artistsPath, `${JSON.stringify(artists, null, 2)}\n`)

console.log(`updated ${report.length} display names (of ${artists.length})`)
for (const row of report.sort((a, b) => a.id.localeCompare(b.id))) {
  console.log(`  [${row.source}] ${row.id}: ${row.from} → ${row.to}${row.ytm ? `  (ytm: ${row.ytm})` : ''}`)
}
