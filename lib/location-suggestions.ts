import { locations } from './malaysia-locations.js'

export function locationMatches(input: string) {
  const query = input.trim().toLocaleLowerCase()
  return query ? locations.filter(location => location.toLocaleLowerCase().includes(query) && location.toLocaleLowerCase() !== query).slice(0, 6) : []
}
