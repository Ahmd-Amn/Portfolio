export const toDateInput = (value: string) => /^\d{4}-\d{2}$/.test(value) ? `${value}-01` : value

export function displayDate(value: string) {
  if (!/^\d{4}-\d{2}(-\d{2})?$/.test(value)) return value
  return new Intl.DateTimeFormat('en', { year: 'numeric', month: 'short', ...(value.length === 10 ? { day: 'numeric' } : {}), timeZone: 'UTC' }).format(new Date(`${toDateInput(value)}T00:00:00Z`))
}

export function displayMonthYear(value: string) {
  return /^\d{4}-\d{2}(-\d{2})?$/.test(value) ? displayDate(value.slice(0, 7)) : value
}

export function cvDateLabel(data: Record<string, unknown>) {
  const start = data.start_date ? displayMonthYear(String(data.start_date)) : ''
  const end = data.end_date ? displayMonthYear(String(data.end_date)) : ''
  if (start || end) return [start, end].filter(Boolean).join(' – ')
  return data.issue_date ? `Issued ${displayMonthYear(String(data.issue_date))}` : ''
}
