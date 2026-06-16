export interface Process {
  motivation: string;
  research: string;
  ideation: string;
  implementation: string;
  reflection: string;
}

export type MaterialType = 'image' | 'document' | 'video' | 'other';

export interface Material {
  id: string;
  name: string;
  type: MaterialType;
  isComplete: boolean;
  description: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  order: number;
  category: string;
  process: Process;
  materials: Material[];
  createdAt: string;
  updatedAt: string;
}

export interface Background {
  education: string;
  experience: string;
  skills: string[];
}

export interface AbilityRequirement {
  name: string;
  requiredLevel: number;
  weight: number;
}

export interface SubmissionItem {
  id: string;
  name: string;
  isRequired: boolean;
  description: string;
  isCompleted: boolean;
}

export interface TargetMajor {
  id: string;
  school: string;
  major: string;
  description: string;
  admissionPreferences: string;
  abilityRequirements: AbilityRequirement[];
  submissionItems: SubmissionItem[];
}

export interface PortfolioVersion {
  id: string;
  name: string;
  createdAt: string;
  snapshot: PortfolioState;
}

export interface PortfolioState {
  projects: Project[];
  background: Background;
  targetMajor?: TargetMajor;
  versions: PortfolioVersion[];
}

export interface AbilityGap {
  name: string;
  currentLevel: number;
  requiredLevel: number;
  gap: number;
  weight: number;
}

export interface MaterialCheckResult {
  completeness: number;
  missingItems: Material[];
  suggestions: string[];
}

export interface NarrativeEvaluation {
  score: number;
  feedback: string[];
}

export interface DiagnosisResult {
  abilityGaps: AbilityGap[];
  overallScore: number;
  narrativeEvaluation: NarrativeEvaluation;
  materialChecks: { projectId: string; projectTitle: string; result: MaterialCheckResult }[];
}
