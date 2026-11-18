/**
 * Deterministic job description parser — no AI or external API required.
 * Uses regex patterns, label matching and heuristics.
 */

export interface ExtractedJob {
  job_title?: string;
  company_name?: string;
  location?: string;
  employment_type?: string;
  work_arrangement?: string;
  salary_min?: number;
  salary_max?: number;
  currency?: string;
  skills?: string[];
  experience_years?: string;
  job_description?: string;
  job_url?: string;
  source?: string;
  confidence: Record<string, 'high' | 'medium' | 'low'>;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  '$': 'USD', '£': 'GBP', '€': 'EUR', '₹': 'INR', 'CA$': 'CAD', 'AU$': 'AUD',
};

function parseSalary(text: string): { min?: number; max?: number; currency?: string } | null {
  // e.g. "$120,000 - $150,000", "₹15L - ₹25L", "$120k to $180k"
  const pattern = /([₹$£€]|CA\$|AU\$)?\s*(\d[\d,]*\.?\d*)\s*[Ll]?\s*(?:[-–to]+\s*([₹$£€]|CA\$|AU\$)?\s*(\d[\d,]*\.?\d*)[Ll]?)?/i;
  const lpa = /(\d+(?:\.\d+)?)\s*[-–]?\s*(\d+(?:\.\d+)?)?\s*(?:LPA|CTC|lpa|ctc)/;
  const lakhs = /(\d+(?:\.\d+)?)\s*[Ll]\s*[-–]?\s*(\d+(?:\.\d+)?)?[Ll]?/;

  let min: number | undefined, max: number | undefined, currency: string | undefined;

  const lpaMatch = text.match(lpa);
  if (lpaMatch) {
    min = parseFloat(lpaMatch[1]) * 100000;
    max = lpaMatch[2] ? parseFloat(lpaMatch[2]) * 100000 : undefined;
    currency = 'INR';
    return { min, max, currency };
  }

  const lakhMatch = text.match(lakhs);
  if (lakhMatch) {
    min = parseFloat(lakhMatch[1]) * 100000;
    max = lakhMatch[2] ? parseFloat(lakhMatch[2]) * 100000 : undefined;
    currency = 'INR';
    return { min, max, currency };
  }

  const match = text.match(pattern);
  if (match) {
    const sym = match[1] || match[3] || '₹';
    currency = CURRENCY_SYMBOLS[sym] ?? 'INR';
    const rawMin = match[2].replace(/,/g, '');
    const rawMax = match[4]?.replace(/,/g, '');
    min = parseFloat(rawMin);
    if (/k/i.test(text.slice(text.indexOf(match[2]), text.indexOf(match[2]) + 10))) min *= 1000;
    if (rawMax) {
      max = parseFloat(rawMax);
      if (/k/i.test(text.slice(text.indexOf(rawMax), text.indexOf(rawMax) + 10))) max *= 1000;
    }
    if (min > 0) return { min, max, currency };
  }
  return null;
}

function extractLine(text: string, labels: string[]): string | undefined {
  for (const label of labels) {
    const re = new RegExp(`${label}[:\\s*]+([^\\n]+)`, 'im');
    const m = text.match(re);
    if (m) return m[1].trim().replace(/^[:\s*-]+/, '').replace(/\s+/g, ' ');
  }
  return undefined;
}

function detectWorkArrangement(text: string): 'remote' | 'hybrid' | 'on-site' | undefined {
  const lower = text.toLowerCase();
  if (/\b(fully remote|100% remote|remote only|work from home|wfh)\b/.test(lower)) return 'remote';
  if (/\bhybrid\b/.test(lower)) return 'hybrid';
  if (/\b(on-?site|onsite|in-?office|in office|in person)\b/.test(lower)) return 'on-site';
  if (/\bremote\b/.test(lower)) return 'remote';
  return undefined;
}

function detectEmploymentType(text: string): string | undefined {
  const lower = text.toLowerCase();
  if (/\b(full.?time)\b/.test(lower)) return 'full-time';
  if (/\b(part.?time)\b/.test(lower)) return 'part-time';
  if (/\b(contract|freelance|contractor)\b/.test(lower)) return 'contract';
  if (/\b(internship|intern)\b/.test(lower)) return 'internship';
  return undefined;
}

function extractSkills(text: string): string[] {
  const techSkills = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust', 'C\\+\\+', 'C#', 'PHP', 'Ruby', 'Swift', 'Kotlin',
    'React', 'Next\\.js', 'Vue', 'Angular', 'Svelte', 'Node\\.js', 'Express', 'FastAPI', 'Django', 'Spring',
    'AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD',
    'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch',
    'REST', 'GraphQL', 'gRPC', 'WebSocket',
    'Git', 'Linux', 'Agile', 'Scrum',
    'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch',
    'React Native', 'Flutter', 'Android', 'iOS',
    'SQL', 'NoSQL', 'Microservices',
  ];

  const found = new Set<string>();
  for (const skill of techSkills) {
    const re = new RegExp(`\\b${skill}\\b`, 'gi');
    if (re.test(text)) {
      found.add(skill.replace(/\\\./g, '.').replace(/\\\+/g, '+'));
    }
  }
  return Array.from(found).slice(0, 15);
}

function extractExperience(text: string): string | undefined {
  const patterns = [
    /(\d+(?:\.\d+)?)\s*[-–+]\s*(\d+(?:\.\d+)?)\s*(?:years?|yrs?)\s*(?:of experience)?/i,
    /(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp)/i,
    /experience\s*[:–]\s*(\d+(?:\.\d+)?)\s*[-–]?\s*(\d+(?:\.\d+)?)?\s*(?:years?|yrs?)/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[0].trim();
  }
  return undefined;
}

function detectSource(url: string): string | undefined {
  if (!url) return undefined;
  if (url.includes('linkedin.com')) return 'LinkedIn';
  if (url.includes('naukri.com')) return 'Naukri';
  if (url.includes('indeed.com')) return 'Indeed';
  if (url.includes('glassdoor.com')) return 'Glassdoor';
  if (url.includes('monster.com')) return 'Monster';
  if (url.includes('wellfound.com') || url.includes('angel.co')) return 'Wellfound';
  if (url.includes('unstop.com')) return 'Unstop';
  if (url.includes('internshala.com')) return 'Internshala';
  return 'Company Website';
}

function cleanDescription(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
    .slice(0, 5000);
}

export function extractJobFromText(text: string, url?: string): ExtractedJob {
  const result: ExtractedJob = { confidence: {} };

  // Job Title — look for structured labels first
  const titleFromLabel = extractLine(text, ['Job Title', 'Position', 'Role', 'Opening', 'Designation']);
  if (titleFromLabel) {
    result.job_title = titleFromLabel.slice(0, 100);
    result.confidence.job_title = 'high';
  } else {
    // Try first line heuristic — often the job title is the first meaningful line
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2 && l.length < 100);
    if (lines.length > 0 && !/^(about|we are|join us|overview|description)/i.test(lines[0])) {
      result.job_title = lines[0];
      result.confidence.job_title = 'medium';
    }
  }

  // Company Name
  const companyFromLabel = extractLine(text, ['Company', 'Organization', 'Employer', 'About company', 'About us']);
  if (companyFromLabel && companyFromLabel.length < 80) {
    result.company_name = companyFromLabel;
    result.confidence.company_name = 'high';
  }

  // Location
  const locationFromLabel = extractLine(text, ['Location', 'Office', 'City', 'Base location', 'Work location']);
  if (locationFromLabel) {
    result.location = locationFromLabel.slice(0, 100);
    result.confidence.location = 'high';
  } else {
    // Pattern: "City, State" or "City, Country"
    const cityState = text.match(/\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)?),\s*([A-Z]{2}|[A-Z][a-z]+)\b/);
    if (cityState) {
      result.location = cityState[0];
      result.confidence.location = 'low';
    }
  }

  // Work arrangement
  const wa = detectWorkArrangement(text);
  if (wa) {
    result.work_arrangement = wa;
    result.confidence.work_arrangement = 'high';
  }

  // Employment type
  const et = detectEmploymentType(text);
  if (et) {
    result.employment_type = et;
    result.confidence.employment_type = 'high';
  }

  // Salary — search in salary-adjacent lines
  const salarySection = extractLine(text, ['Salary', 'Compensation', 'CTC', 'Pay', 'Package', 'Stipend', 'Remuneration']);
  const salarySource = salarySection ?? text;
  const salaryMatch = parseSalary(salarySource);
  if (salaryMatch?.min) {
    result.salary_min = salaryMatch.min;
    result.salary_max = salaryMatch.max;
    result.currency = salaryMatch.currency ?? 'INR';
    result.confidence.salary = salarySection ? 'high' : 'medium';
  }

  // Skills
  const skills = extractSkills(text);
  if (skills.length > 0) {
    result.skills = skills;
    result.confidence.skills = 'high';
  }

  // Experience
  const exp = extractExperience(text);
  if (exp) {
    result.experience_years = exp;
    result.confidence.experience_years = 'medium';
  }

  // Source from URL
  if (url) {
    result.job_url = url;
    result.source = detectSource(url);
  }

  // Job description — the full cleaned text
  result.job_description = cleanDescription(text);

  return result;
}
