/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ZoneStatus = 'Operational' | 'Caution' | 'Restricted' | 'Closed' | 'Evacuated';
export type SeverityLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface HazardEntry {
  id: string;
  // Part 1: Hazard Identification
  hazardDescription: string;
  hazardCategory: 'Physical' | 'Chemical' | 'Biological' | 'Ergonomic' | 'Psychosocial' | 'Safety' | 'Environmental';
  
  // Part 2: Zone Status
  zoneId: string;
  zoneStatus: ZoneStatus;
  locationDetails: string;
  
  // Part 3: Impact & Risk Assessment
  likelihood: number; // 1-5
  consequence: number; // 1-5
  riskLevel: SeverityLevel;
  potentialImpact: string;
  
  // Part 4: Recovery & Action
  immediateActionTaken: string;
  recommendedAction: string;
  owner: string;
  targetDate: string;
  
  photos: string[];
}

export interface InspectionReport {
  id: string;
  createdAt: string;
  updatedAt: string;
  isDraft: boolean;
  
  // Header
  facility: string;
  terminal: string;
  floor: string;
  sector: string;
  reporterName: string;
  staffId: string;
  role: string;
  shift: 'Morning' | 'Afternoon' | 'Night';
  reportingDate: string;
  
  // The 4-Part Hazard Entries
  hazards: HazardEntry[];
  
  // Sign-off
  reporterSignature: string;
  supervisorSignature: string;
  aocAcknowledgement: string;
}
