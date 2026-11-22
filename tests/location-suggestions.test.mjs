import assert from 'node:assert/strict'
import test from 'node:test'
import { locationMatches } from '../lib/location-suggestions.ts'

test('matches typed text anywhere in a location', () => {
  assert.deepEqual(locationMatches('cyb'), ['Cyberjaya, Selangor, Malaysia'])
  assert.ok(locationMatches('terengganu').some(place => place === 'Terengganu, Malaysia'))
  assert.ok(locationMatches('kelantan').some(place => place === 'Kelantan, Malaysia'))
  assert.deepEqual(locationMatches(''), [])
})
