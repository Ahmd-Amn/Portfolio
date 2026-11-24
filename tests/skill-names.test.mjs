import assert from 'node:assert/strict'
import test from 'node:test'
import { skillNames } from '../lib/skill-names.ts'

test('skill batches ignore blank lines and keep one trimmed name per line', () => {
  assert.deepEqual(skillNames('  TypeScript\r\n\r\nReact  \n CSS '), ['TypeScript', 'React', 'CSS'])
})
