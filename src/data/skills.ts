import type { Skill } from '../types'

export const SKILLS: Skill[] = [
  { id: 'acrobacia', name: 'Acrobacia', ability: 'des' },
  { id: 'arcanismo', name: 'Arcanismo', ability: 'int' },
  { id: 'atletismo', name: 'Atletismo', ability: 'for' },
  { id: 'atuacao', name: 'Atuação', ability: 'car' },
  { id: 'enganacao', name: 'Enganação', ability: 'car' },
  { id: 'furtividade', name: 'Furtividade', ability: 'des' },
  { id: 'historia', name: 'História', ability: 'int' },
  { id: 'intimidacao', name: 'Intimidação', ability: 'car' },
  { id: 'intuicao', name: 'Intuição', ability: 'sab' },
  { id: 'investigacao', name: 'Investigação', ability: 'int' },
  { id: 'lidar-animais', name: 'Lidar com Animais', ability: 'sab' },
  { id: 'medicina', name: 'Medicina', ability: 'sab' },
  { id: 'natureza', name: 'Natureza', ability: 'int' },
  { id: 'percepcao', name: 'Percepção', ability: 'sab' },
  { id: 'persuasao', name: 'Persuasão', ability: 'car' },
  { id: 'prestidigitacao', name: 'Prestidigitação', ability: 'des' },
  { id: 'religiao', name: 'Religião', ability: 'int' },
  { id: 'sobrevivencia', name: 'Sobrevivência', ability: 'sab' },
]

export const skillById = (id: string) => SKILLS.find((s) => s.id === id)!
