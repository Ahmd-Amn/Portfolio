import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeSlug } from '../lib/slug.ts'

test('project URL names accept spaces and capital letters', () => {
  assert.equal(normalizeSlug('  My New Project  '), 'my-new-project')
  assert.equal(normalizeSlug('My - Project'), 'my-project')
})
