export const educationLevels = [
    "School",
    "Undergrad",
    "Postgrad",
    "Gap year / prepping",
];

export const fieldOptions = [
    "Engineering",
    "Computer Science",
    "Business / Commerce",
    "Arts / Humanities",
    "Psychology",
    "Science (PCM/PCB)",
    "Medicine / Health",
    "Law",
    "Design",
    "Other",
];

export const opportunityOptions = [
    { id: "competitions_open_calls", label: "Competitions/Open Calls" },
    { id: "case_competitions", label: "Case Competitions" },
    { id: "hackathons", label: "Hackathons" },
    { id: "fellowships", label: "Fellowships" },
    { id: "ideathon_think_tanks", label: "Ideathon/Think Tanks" },
    { id: "leadership_programs", label: "Leadership Programs" },
    { id: "awards_recognition", label: "Awards & Recognition" },
    { id: "grants_scholarships", label: "Grants & Scholarships" },
    { id: "research_paper_ra_calls", label: "Research Paper Conferences/RA calls" },
    { id: "upskilling_events", label: "Upskilling Courses/Certification/Events" },
];

export const domainOptions = [
    { id: "business_management_consulting", label: "Business, Management & Consulting" },
    { id: "creative_content", label: "Creative & Content" },
    { id: "tech_data", label: "Tech & Data" },
    { id: "impact_change", label: "Impact & Change" },
    { id: "law_policy", label: "Law & Policy" },
    { id: "startup_finance", label: "Startup & Finance" },
    { id: "people_mind", label: "People & Mind" },
];

// Mapping from both labels AND legacy values to stable IDs
export const legacyOpportunityMapping: Record<string, string> = {
    // Labels to IDs
    "Competitions/Open Calls": "competitions_open_calls",
    "Case Competitions": "case_competitions",
    "Hackathons": "hackathons",
    "Fellowships": "fellowships",
    "Ideathon/Think Tanks": "ideathon_think_tanks",
    "Leadership Programs": "leadership_programs",
    "Awards & Recognition": "awards_recognition",
    "Grants & Scholarships": "grants_scholarships",
    "Research Paper Conferences/RA calls": "research_paper_ra_calls",
    "Upskilling Courses/Certification/Events": "upskilling_events",
    // Legacy values to IDs
    "Internships": "fellowships",
    "Scholarships": "grants_scholarships",
    "Competitions": "competitions_open_calls",
    "Research programs": "research_paper_ra_calls",
    "Bootcamps": "upskilling_events",
};

export const legacyDomainMapping: Record<string, string> = {
    // Labels to IDs
    "Business, Management & Consulting": "business_management_consulting",
    "Creative & Content": "creative_content",
    "Tech & Data": "tech_data",
    "Impact & Change": "impact_change",
    "Law & Policy": "law_policy",
    "Startup & Finance": "startup_finance",
    "People & Mind": "people_mind",
    // Legacy values to IDs
    "AI & ML": "tech_data",
    "AI/ML": "tech_data",
    "Web / App Dev": "tech_data",
    "Web Development": "tech_data",
    "App Development": "tech_data",
    "Blockchain": "tech_data",
    "Cybersecurity": "tech_data",
    "Data Science": "tech_data",
    "Open Source": "tech_data",
    "Finance & Markets": "startup_finance",
    "Entrepreneurship": "startup_finance",
    "Marketing": "creative_content",
    "Design": "creative_content",
    "Design/UI-UX": "creative_content",
    "Consulting": "business_management_consulting",
    "Product Management": "business_management_consulting",
    "Product": "business_management_consulting",
    "Social Impact": "impact_change",
    "Policy / Governance": "law_policy",
    "Psychology / Mental Health": "people_mind",
};

export const normalizeOpportunityInterests = (interests: string[]): string[] => {
    if (!interests) return [];
    return Array.from(new Set(interests.map(interest => legacyOpportunityMapping[interest] || interest)));
};

export const normalizeDomainPreferences = (domains: string[]): string[] => {
    if (!domains) return [];
    return Array.from(new Set(domains.map(domain => legacyDomainMapping[domain] || domain)));
};

export const struggleOptions = [
    "Finding relevant openings",
    "Knowing if I qualify",
    "Applying the right way",
    "Resume & portfolio",
    "Tracking deadlines",
    "Interview prep",
];

export const stepAnim = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
};

export const stateOptions: string[] = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
    "Andaman and Nicobar Islands",
    "Chandigarh",
    "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi",
    "Jammu and Kashmir",
    "Ladakh",
    "Lakshadweep",
    "Puducherry"
]

