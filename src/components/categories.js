export const CATEGORIES = [
  { id: 'Deities_and_Oaths',      label: 'Deities & Oaths',       color: '#8b3a1a' },
  { id: 'Rituals_and_Spaces',     label: 'Rituals & Spaces',      color: '#5a6e3a' },
  { id: 'Divination_and_Omens',   label: 'Divination & Omens',    color: '#4a5c7a' },
  { id: 'Cosmological_Concepts',  label: 'Cosmological Concepts', color: '#6a3a7a' },
  { id: 'Supernatural_Beings',    label: 'Supernatural Beings',   color: '#2a6a6a' },
  { id: 'Death_and_Mortuary_Belief', label: 'Death & Mortuary Belief', color: '#3a3a3a' },
  { id: 'Tribal_Sacral_Roles',    label: 'Tribal Sacral Roles',   color: '#7a5a1a' },
  { id: 'Sacred_Lexicon',         label: 'Sacred Lexicon',        color: '#8a4a5a' },
]

export const categoryColor = (id) =>
  CATEGORIES.find(c => c.id === id)?.color ?? '#888'

export const categoryLabel = (id) =>
  CATEGORIES.find(c => c.id === id)?.label ?? id
