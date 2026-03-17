/**
 * DSA Tracker - Domain Models
 * Strict TypeScript interfaces matching the Firestore NoSQL document structure.
 */

export interface User {
  uid: string;
  email: string;
  displayName: string;
}

/**
 * A concept tag with a definition and complexity note, used for glance-panel tooltips.
 */
export interface ConceptTag {
  name: string;
  definition: string;
  /** e.g. "O(N)", "O(1) amortized" */
  complexity: string;
}

export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type Language = 'Java' | 'Python' | 'TypeScript' | 'C++' | 'JavaScript';

export interface Problem {
  id: string;
  title: string;
  difficulty: Difficulty;
  /** References tag names, e.g. ["Sliding Window", "Deque"] */
  tags: string[];
  description: string;
  approachList: string[];
  codeSnippet: string;
  language: Language;
}

export interface Day {
  id: string;
  title: string;
  /** Array of ConceptTag names shown in the glance panel */
  summaryTags: string[];
  problems: Problem[];
}

export interface Module {
  id: string;
  title: string;
  description: string;
  days: Day[];
}
