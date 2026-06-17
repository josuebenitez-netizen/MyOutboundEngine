export interface ProspectBase {
  first_name: string;
  last_name: string;
  email: string;
  title: string;
  company: string;
  industry: string;
  linkedin_url: string;
}

// Use this when you need dynamic key access (CSV mapping etc.)
export type Prospect = ProspectBase & { [key: string]: string };

export interface Enrichment {
  seniority: "C-Suite" | "VP" | "Director" | "Manager" | "IC" | "Unknown";
  likelyOKRs: string[];
  painPoints: string[];
  bestAngle: string;
  recommendedTone: "direct" | "consultative" | "peer" | "respectful";
  toneRationale: string;
  icebreaker: string;
}

export interface EnrichedProspect extends ProspectBase {
  enrichment?: Enrichment;
}

export interface KnowledgeBase {
  productSummary: string;
  icp: string;
  valueProps: { persona: string; prop: string }[];
  proofPoints: string[];
  objections: { objection: string; response: string }[];
}

export const REQUIRED_FIELDS = [
  { key: "first_name", label: "First Name" },
  { key: "last_name", label: "Last Name" },
  { key: "email", label: "Email" },
  { key: "title", label: "Title" },
  { key: "company", label: "Company" },
  { key: "industry", label: "Industry" },
  { key: "linkedin_url", label: "LinkedIn URL" },
] as const;
