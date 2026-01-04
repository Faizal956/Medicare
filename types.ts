
export interface MedicineAnalysis {
  name: string;
  dosage: string;
  frequency: string;
  instructions: string;
  purpose: string;
  sideEffects: string[];
  translatedText: string;
}

export interface InteractionResult {
  hasConflict: boolean;
  severity: 'high' | 'moderate' | 'none';
  explanation: string;
  recommendation: string;
}

export interface MedicineRecord {
  id: string;
  name: string;
  addedAt: number;
}

export interface UserProfile {
  id: string;
  name: string;
  color: string;
  preferredLanguageCode: string;
  preferredVoiceId: string;
  medications: MedicineRecord[];
  reminders: Reminder[];
}

export interface Voice {
  id: string;
  name: string;
  persona: string;
}

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  voiceName: string;
}

export interface Reminder {
  id: string;
  medicineName: string;
  dosage: string;
  time: string; // HH:mm
  active: boolean;
}

export interface PharmacyLocation {
  name: string;
  address: string;
  uri: string;
}

export enum AppState {
  IDLE = 'IDLE',
  SCANNING = 'SCANNING',
  ANALYZING = 'ANALYZING',
  CHECKING_INTERACTIONS = 'CHECKING_INTERACTIONS',
  RESULT = 'RESULT',
  ERROR = 'ERROR'
}

export type Tab = 'scan' | 'reminders' | 'pharmacies' | 'profile';
