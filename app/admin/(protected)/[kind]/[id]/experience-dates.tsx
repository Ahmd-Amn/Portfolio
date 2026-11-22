'use client'

import { useState } from 'react'
import { toDateInput } from '@/lib/dates'

export default function ExperienceDates({ initialStart, initialEnd, currentLabel = 'I currently work here' }: { initialStart: string; initialEnd: string; currentLabel?: string }) {
  const [start, setStart] = useState(toDateInput(initialStart))
  const [end, setEnd] = useState(initialEnd === 'Current' ? '' : toDateInput(initialEnd))
  const [current, setCurrent] = useState(initialEnd === 'Current')

  return <div className="experience-dates">
    <div className="field">
      <label htmlFor="start_date">Start date</label>
      <input id="start_date" name="start_date" type="date" value={start} onChange={event => setStart(event.target.value)} />
    </div>
    <div className="field">
      <label htmlFor="end_date">End date</label>
      <input id="end_date" name={current ? undefined : 'end_date'} type="date" min={start || undefined} value={end} onChange={event => setEnd(event.target.value)} disabled={current} />
      {current && <input type="hidden" name="end_date" value="Current" />}
      <label className="experience-current"><input type="checkbox" checked={current} onChange={event => setCurrent(event.target.checked)} /> {currentLabel}</label>
    </div>
  </div>
}
