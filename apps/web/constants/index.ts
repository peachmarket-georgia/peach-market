export const GEORGIA_LOCATIONS = [
  'Atlanta',
  'Duluth',
  'Suwanee',
  'Johns Creek',
  'Alpharetta',
  'Norcross',
  'Lawrenceville',
  'Buford',
  'Sugar Hill',
  'Gwinnett County',
  'Marietta',
  'Roswell',
  '기타 (Georgia)',
] as const

export type GeorgiaLocation = (typeof GEORGIA_LOCATIONS)[number]
