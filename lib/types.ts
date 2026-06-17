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

// --- Sequence types ---

export interface SequenceStep {
  stepNumber: number;
  label: string;
  dayDelay: number;
  goal: string;
}

export interface Email {
  subject: string;
  previewText: string;
  body: string;
  cta: string;
}

export interface ProspectSequence {
  prospectEmail: string;
  prospectName: string;
  steps: Email[];
}

export interface SequenceConfig {
  steps: SequenceStep[];
  senderName: string;
  senderTitle: string;
  companyName: string;
}

export const DEFAULT_SEQUENCE_CONFIG: SequenceConfig = {
  steps: [
    { stepNumber: 1, label: "Cold Open", dayDelay: 0, goal: "Spark curiosity with a relevant hook" },
    { stepNumber: 2, label: "Value Add", dayDelay: 3, goal: "Share a specific insight or resource" },
    { stepNumber: 3, label: "Social Proof", dayDelay: 7, goal: "Show evidence from similar companies" },
    { stepNumber: 4, label: "Breakup", dayDelay: 14, goal: "Final touch — low pressure, leave the door open" },
  ],
  senderName: "",
  senderTitle: "",
  companyName: "",
};

// --- A/B Variant types ---

export interface EmailVariant extends Email {
  variantLabel: string; // "A" | "B"
  variantStrategy: string; // e.g. "Short + direct CTA" or "Longer + soft CTA"
}

export interface StepVariants {
  original: Email;
  variants: EmailVariant[];
  selected: "original" | "A" | "B" | "random";
}

export interface ProspectVariants {
  prospectEmail: string;
  prospectName: string;
  steps: StepVariants[];
}
