export interface Intent {
  id?: number;
  name: string;
  description: string;
}

export interface StopWord {
  id: number;
  pattern: string;
  type: string; // "Regex" | "Word"
  description: string;
}

export interface Phrase {
  id: number; // local session id
  intent: string;
  phrase: string;
  cleanedPhrase: string;
  category: string;
  topic: string;
  createdAt?: number;
}

export interface SavedPhrase {
  intent: string;
  phrase: string;
  cleanedPhrase: string;
  category: string;
  topic: string;
  createdAt?: number;
}

export interface AnalyticsCategory {
  rank: number;
  name: string;
  count: number;
  percentage: string;
  savedAt?: number;
}

export interface AnalyticsInsight {
  rank: number;
  phrase: string;
  cleanedPhrase: string;
  category: string;
  topic: string;
  frequency: number;
  analyzedAt?: number;
}

export interface SystemSettings {
  system_name: string;
  system_logo: string;
}

export type TabName = 'dashboard' | 'workspace' | 'duplicate-center' | 'intent-matching' | 'intents-center' | 'stopwords-center' | 'logo-settings';
