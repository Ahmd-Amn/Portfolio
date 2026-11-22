import assert from 'node:assert/strict'
import test from 'node:test'
import { sameOrigin } from '../lib/same-origin.ts'

test('accepts the public host even when Next uses an internal request URL', () => {
  const request = new Request('http://127.0.0.1:3000/api/cv', { headers: { host: 'portfolio.example.com', origin: 'https://portfolio.example.com' } })
  assert.equal(sameOrigin(request), true)
})

test('rejects cross-origin and missing-origin requests', () => {
  assert.equal(sameOrigin(new Request('https://portfolio.example.com/api/cv', { headers: { host: 'portfolio.example.com', origin: 'https://attacker.example.com' } })), false)
  assert.equal(sameOrigin(new Request('https://portfolio.example.com/api/cv', { headers: { host: 'portfolio.example.com' } })), false)
})
