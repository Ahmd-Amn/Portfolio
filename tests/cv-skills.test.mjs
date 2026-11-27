import test from 'node:test'
import assert from 'node:assert/strict'
import { cvSkillGroups } from '../lib/cv-skills.ts'

test('CV skills group by saved category in selection order and use CV wording', () => {
  const items = [
    { id: '1', kind: 'skills', data: { name: 'Python', category: 'Languages' } },
    { id: '2', kind: 'skills', data: { name: 'Flask', category: 'Backend and databases' } },
    { id: '3', kind: 'skills', data: { name: 'Java', category: 'Languages' } },
    { id: '4', kind: 'projects', data: { title: 'Website' } },
    { id: '5', kind: 'skills', data: { name: 'Git', category: '  ' } }
  ]
  assert.deepEqual(cvSkillGroups(items, { '2': 'FastAPI' }), [
    'Languages: Python, Java', 'Backend and databases: FastAPI', 'Other: Git'
  ])
  assert.deepEqual(cvSkillGroups([]), [])
})
