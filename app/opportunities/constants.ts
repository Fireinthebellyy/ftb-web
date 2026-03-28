export const FEATURE_FLAGS = {
  showTrendingTags: false,
};

export const AVAILABLE_TYPES = [
  "competitions_open_calls",
  "case_competitions",
  "hackathons",
  "fellowships",
  "ideathon_think_tanks",
  "leadership_programs",
  "awards_recognition",
  "grants_scholarships",
  "research_paper_ra_calls",
  "upskilling_events",
];

/**
 * Normalizes legacy type values to the current taxonomy.
 */
export const normalizeType = (type: string): string => {
  const normalized = type.toLowerCase().trim();
  const legacyMap: Record<string, string> = {
    competitions: "competitions_open_calls",
    competition: "competitions_open_calls",
    "open-calls": "competitions_open_calls",
    "open_calls": "competitions_open_calls",
    hackathon: "competitions_open_calls",
    case_comp: "case_competitions",
    "case-competitions": "case_competitions",
    ideathons: "ideathon_think_tanks",
    ideathon: "ideathon_think_tanks",
    "think-tanks": "ideathon_think_tanks",
    "think_tanks": "ideathon_think_tanks",
    leadership: "leadership_programs",
    awards: "awards_recognition",
    grants: "grants_scholarships",
    grant: "grants_scholarships",
    scholarships: "grants_scholarships",
    "research-papers": "research_paper_ra_calls",
    "research_papers": "research_paper_ra_calls",
    "ra-calls": "research_paper_ra_calls",
    upskilling: "upskilling_events",
    courses: "upskilling_events",
  };
  return legacyMap[normalized] || normalized;
};

export const FIELD_TAGS = [
  "Business, Management & Consulting(Consulting/Management/Product/Strategy/Operations)",
  "Creative & Content(Marketing/Design/UI UX/Literature/Film & Media/Content)",
  "Tech & Data(AI/ML/Analytics/Tech/Data Science)",
  "Impact & Change(Social Impact/Dev Comm)",
  "Law & Policy(Law, Governance, Policy, Think Tanks)",
  "Startup & Finance(Entrepreneurship, VC, Finance)",
  "People & Mind(HR, Psychology, Research)",
];

export const formatTypeName = (type: string): string => {
  const mapping: Record<string, string> = {
    competitions_open_calls: "Competitions/Open Calls",
    case_competitions: "Case Competitions",
    hackathons: "Hackathons",
    fellowships: "Fellowships",
    ideathon_think_tanks: "Ideathon/Think Tanks",
    leadership_programs: "Leadership Programs",
    awards_recognition: "Awards & Recognition",
    grants_scholarships: "Grants & Scholarships",
    research_paper_ra_calls: "Research Paper Conferences/RA calls",
    upskilling_events: "Upskilling Courses/Certification/Events",
  };
  return mapping[type] || type.charAt(0).toUpperCase() + type.slice(1);
};

export const getTypeDropdownLabel = (selected: string[]) => {
  if (selected.length === 0) return "Opportunity types";
  if (selected.length === AVAILABLE_TYPES.length) return "Opportunity types";
  if (selected.length === 1) return formatTypeName(selected[0]);
  return `${selected.length} types`;
};
