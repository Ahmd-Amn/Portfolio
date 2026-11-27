export function cvSkillGroups(items: { id: string; kind: string; data: Record<string, unknown> }[], overrides: Record<string, string> = {}) {
  const groups = new Map<string, string[]>()
  for (const item of items) {
    if (item.kind !== 'skills') continue
    const category = String(item.data.category || '').trim() || 'Other'
    const names = groups.get(category) || []
    names.push(overrides[item.id] || String(item.data.name || ''))
    groups.set(category, names)
  }
  return Array.from(groups, ([category, names]) => `${category}: ${names.join(', ')}`)
}
