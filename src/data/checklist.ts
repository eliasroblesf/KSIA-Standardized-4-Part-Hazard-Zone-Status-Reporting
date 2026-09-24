export const HAZARD_CATEGORIES = [
  'Physical',
  'Chemical',
  'Biological',
  'Ergonomic',
  'Psychosocial',
  'Safety',
  'Environmental'
] as const;

export const ZONE_STATUSES = [
  'Operational',
  'Caution',
  'Restricted',
  'Closed',
  'Evacuated'
] as const;

export const DEFAULT_HAZARD_ENTRY = {
  hazardDescription: '',
  hazardCategory: 'Safety',
  zoneId: '',
  zoneStatus: 'Operational',
  locationDetails: '',
  likelihood: 1,
  consequence: 1,
  riskLevel: 'Low',
  potentialImpact: '',
  immediateActionTaken: '',
  recommendedAction: '',
  owner: '',
  targetDate: '',
  photos: []
};
