import assert from 'node:assert/strict'
import test from 'node:test'
import { cvDateLabel, displayDate, displayMonthYear, toDateInput } from '../lib/dates.ts'

test('existing month dates open in the date picker and display without a day', () => {
  assert.equal(toDateInput('2024-06'), '2024-06-01')
  assert.equal(displayDate('2024-06'), 'Jun 2024')
})

test('new full dates display clearly and current roles keep their label', () => {
  assert.equal(displayDate('2024-06-17'), 'Jun 17, 2024')
  assert.equal(displayDate('Current'), 'Current')
  assert.equal(displayMonthYear('2024-06-17'), 'Jun 2024')
  assert.equal(cvDateLabel({ start_date: '2023-01-09', end_date: 'Current' }), 'Jan 2023 – Current')
  assert.equal(cvDateLabel({ issue_date: '2024-06-17' }), 'Issued Jun 2024')
})
