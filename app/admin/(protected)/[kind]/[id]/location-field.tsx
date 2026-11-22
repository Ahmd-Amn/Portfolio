'use client'

import { useState } from 'react'
import { locationMatches } from '@/lib/location-suggestions'

export default function LocationField({ initial, name = 'location', label = 'Location', placeholder = 'Start typing a city, state, or Remote', help = 'Choose a match or keep your own wording.' }: { initial: string; name?: string; label?: string; placeholder?: string; help?: string }) {
  const [location, setLocation] = useState(initial)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const matches = open ? locationMatches(location) : []

  function choose(value: string) { setLocation(value); setOpen(false); setActive(0); document.getElementById(name)?.dispatchEvent(new Event('input', { bubbles: true })) }

  return <div className="field experience-location">
    <label htmlFor={name}>{label}</label>
    <div className="location-combobox">
    <input
      id={name}
      name={name}
      role="combobox"
      aria-autocomplete="list"
      aria-expanded={matches.length > 0}
      aria-controls={matches.length ? `${name}-options` : undefined}
      aria-activedescendant={matches.length ? `${name}-option-${active}` : undefined}
      autoComplete="off"
      placeholder={placeholder}
      value={location}
      onChange={event => { setLocation(event.target.value); setOpen(true); setActive(0) }}
      onFocus={() => { if (location.trim()) setOpen(true) }}
      onBlur={() => setOpen(false)}
      onKeyDown={event => {
        if (event.key === 'Escape') setOpen(false)
        if (event.key === 'ArrowDown' && matches.length) { event.preventDefault(); setActive((active + 1) % matches.length) }
        if (event.key === 'ArrowUp' && matches.length) { event.preventDefault(); setActive((active - 1 + matches.length) % matches.length) }
        if (event.key === 'Enter' && matches.length) { event.preventDefault(); choose(matches[active]) }
      }}
    />
    {matches.length > 0 && <div id={`${name}-options`} className="location-dropdown" role="listbox" aria-label="Matching locations">
      {matches.map((value, index) => <button
        id={`${name}-option-${index}`}
        type="button"
        role="option"
        aria-selected={index === active}
        tabIndex={-1}
        key={value}
        onPointerDown={event => event.preventDefault()}
        onClick={() => choose(value)}
      >{value}</button>)}
    </div>}
    </div>
    <span className="field-help">{help}</span>
  </div>
}
