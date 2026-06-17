export interface Prospect {
  first_name: string;
  last_name: string;
  email: string;
  title: string;
  company: string;
  industry: string;
  linkedin_url: string;
  [key: string]: string;
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
