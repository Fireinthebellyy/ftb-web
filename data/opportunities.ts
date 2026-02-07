export interface Opportunity {
  id: number;
  title: string;
  company: string;
  deadline?: string;
  type: string; // 'Internship' | 'Hackathon' | 'Job' | 'Fellowship'
  fit?: string;
  fitColor?: string;
  matchReason?: string;
  tags?: string[];
  expectedResultWindow?: string;
  logo?: string;
  skills?: string[];
  description?: string;
  expectations?: string[];
  // For Tracker State
  status?: string;
  addedAt?: string;
  appliedAt?: string;
  result?: string | null;
  notes?: string;
  draftData?: any;
  isHighPriority?: boolean;
  fitScore?: number;
  fitLabel?: string;
}

export const opportunities: Opportunity[] = [
  {
    id: 1,
    title: "Product Design Intern",
    company: "Airbnb",
    deadline: "2026-02-15T23:59:59",
    type: "Internship",
    fit: "High",
    fitColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
    matchReason: "Matches your Design major & Figma skill",
    tags: ["Remote", "Paid", "Design", "Figma", "Product Thinking"],
    expectedResultWindow: "2-3 weeks after closing",
    logo: "https://logo.clearbit.com/airbnb.com?size=80",
    skills: ["Figma", "Prototyping", "Visual Design", "Wireframing"],
    description: "Join our world-class design team to craft experiences that make anyone feel at home anywhere. You'll work closely with PMs and Engineers to ship real features.",
    expectations: [
      "Contribute to the design system (Dalton)",
      "Create high-fidelity prototypes for mobile flows",
      "Participate in weekly design critiques"
    ]
  },
  {
    id: 2,
    title: "Frontend Engineering Intern",
    company: "Vercel",
    deadline: "2026-01-28T23:59:59", // Urgent (tomorrow)
    type: "Internship",
    fit: "Medium",
    fitColor: "bg-amber-100 text-amber-700 border-amber-200",
    matchReason: "Good React skills, missing TypeScript",
    tags: ["Engineering", "React", "Frontend", "Next.js"],
    expectedResultWindow: "Rolling basis (approx 1 week)",
    logo: "https://logo.clearbit.com/vercel.com?size=80",
    skills: ["React", "TypeScript", "Next.js", "CSS Modules"],
    description: "Help build the web's next generation platform. You'll work on the core Next.js framework or the Vercel dashboard, improving performance and DX.",
    expectations: [
      "Ship production code to Vercel's dashboard",
      "Improve Core Web Vitals for internal tools",
      "Write documentation for new features"
    ]
  },
  {
    id: 3,
    title: "Space Apps Challenge 2026",
    company: "NASA",
    deadline: "2026-03-01T23:59:59",
    type: "Hackathon",
    fit: "Stretch",
    fitColor: "bg-purple-100 text-purple-700 border-purple-200",
    matchReason: "Great for networking, high competition",
    tags: ["Space", "Innovation", "Python", "AI"],
    expectedResultWindow: "Winners announced April 2026",
    logo: "https://logo.clearbit.com/nasa.gov?size=80",
    skills: ["Python", "Data Analysis", "Machine Learning", "Physics"],
    description: "Collaborate with scientists and engineers to solve real-world problems using NASA's open data. A 48-hour global hackathon event.",
    expectations: [
      "Build a working prototype in 48 hours",
      "Present your solution to judges",
      "Collaborate with a cross-functional team"
    ]
  },
  {
    id: 4,
    title: "Associate PM Rotational Program",
    company: "Google",
    deadline: "2025-12-15T23:59:59", // Expired
    type: "Job",
    fit: "High",
    fitColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
    matchReason: "Perfect fit for your profile",
    tags: ["Mountain View", "APM", "Product Thinking", "Leadership"],
    expectedResultWindow: "Closed",
    logo: "https://logo.clearbit.com/google.com?size=80",
    skills: ["Product Management", "Data Analytics", "Leadership", "Communication"],
    description: "Google's APM program is a world-renowned rotational program where you'll lead product development across different Google products.",
    expectations: [
      "Lead product strategy for a feature",
      "Analyze user data to make decisions",
      "Collaborate with Engineering and Design leads"
    ]
  },
  {
    id: 5,
    title: "Startup Founders Fellowship",
    company: "Y Combinator",
    deadline: "2026-04-10T23:59:59",
    type: "Fellowship",
    fit: "High",
    fitColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
    matchReason: "Matches your Startups interest",
    tags: ["Startups", "Founder", "Innovation"],
    expectedResultWindow: "Interview invites in May",
    logo: "https://logo.clearbit.com/ycombinator.com?size=80",
    skills: ["Entrepreneurship", "Product Development", "Sales", "Pitching"],
    description: "A specialized track for student founders. Get funding, mentorship, and access to the YC network to build your startup.",
    expectations: [
      "Build an MVP of your startup",
      "Gain initial traction / users",
      "Pitch to investors on Demo Day"
    ]
  },
  {
    id: 6,
    title: "Software Engineer Intern",
    company: "Netflix",
    deadline: "2026-02-28T23:59:59",
    type: "Internship",
    logo: "https://logo.clearbit.com/netflix.com?size=80",
    skills: ["Java", "Spring Boot", "Microservices", "System Design"],
    description: "Join the team building the world's leading entertainment service. Work on high-scale backend systems.",
    expectations: ["Build scalable microservices", "Improve API latency", "Write production-quality code"],
    tags: ["Backend", "Streaming", "High Scale"]
  },
  {
    id: 7,
    title: "Data Science Intern",
    company: "Tesla",
    deadline: "2026-03-15T23:59:59",
    type: "Internship",
    logo: "https://logo.clearbit.com/tesla.com?size=80",
    skills: ["Python", "TensorFlow", "Computer Vision", "SQL"],
    description: "Analyze autopilot data to improve safety features. Work with massive datasets from the fleet.",
    expectations: ["Train deep learning models", "Analyze vehicle telemetry data", "Present findings to Autopilot team"],
    tags: ["AI", "Automotive", "Big Data"]
  },
  {
    id: 8,
    title: "PM Intern (Xbox)",
    company: "Microsoft",
    deadline: "2026-02-10T23:59:59",
    type: "Internship",
    logo: "https://logo.clearbit.com/microsoft.com?size=80",
    skills: ["Product Management", "Gaming", "Data Analysis", "User Research"],
    description: "Shape the future of gaming. Define features for the next Xbox console update.",
    expectations: ["Conduct gamer user research", "Define feature roadmap", "Work with game studios"],
    tags: ["Gaming", "PM", "Hardware"]
  },
  {
    id: 9,
    title: "UX Research Intern",
    company: "Spotify",
    deadline: "2026-03-20T23:59:59",
    type: "Internship",
    logo: "https://logo.clearbit.com/spotify.com?size=80",
    skills: ["User Research", "Usability Testing", "Figma", "Psychology"],
    description: "Understand how people listen to music and podcasts. Inform product decisions with qualitative data.",
    expectations: ["Run usability studies", "Interview users", "Synthesize insights for designers"],
    tags: ["Music", "Research", "Design"]
  },
  {
    id: 10,
    title: "Quant Developer Intern",
    company: "Jane Street",
    deadline: "2026-01-30T23:59:59",
    type: "Internship",
    logo: "https://logo.clearbit.com/janestreet.com?size=80",
    skills: ["OCaml", "C++", "Mathematics", "Algorithms"],
    description: "Build the trading systems that power our global operations. Solve hard problems in distributed systems.",
    expectations: ["Optimize low-latency trading code", "Build internal tools", "Learn OCaml"],
    tags: ["Finance", "HFT", "Algorithms"]
  },
  {
    id: 11,
    title: "Marketing Intern",
    company: "Red Bull",
    deadline: "2026-04-01T23:59:59",
    type: "Internship",
    logo: "https://logo.clearbit.com/redbull.com?size=80",
    skills: ["Social Media", "Content Creation", "Events", "Brand Strategy"],
    description: "Give wings to our brand. Manage campus events and digital campaigns.",
    expectations: ["Organize campus activations", "Create social content", "Analyze campaign performance"],
    tags: ["Marketing", "FMCG", "Events"]
  },
  {
    id: 12,
    title: "Mobile Engineer Intern",
    company: "Uber",
    deadline: "2026-02-20T23:59:59",
    type: "Internship",
    logo: "https://logo.clearbit.com/uber.com?size=80",
    skills: ["Swift", "iOS", "mobile", "Objective-C"],
    description: "Build features for the Uber Rider app used by millions daily.",
    expectations: ["Implement new UI flows", "Fix bugs in the mobile app", "Optimize battery usage"],
    tags: ["Mobile", "iOS", "Gig Economy"]
  },
  {
    id: 13,
    title: "AI Research Intern",
    company: "OpenAI",
    deadline: "2026-01-25T23:59:59",
    type: "Internship",
    logo: "https://logo.clearbit.com/openai.com?size=80",
    skills: ["Python", "PyTorch", "NLP", "Research"],
    description: "Push the boundaries of AGI. Work on large language models.",
    expectations: ["Run experiments on GPUs", "Read research papers", "Contribute to model training"],
    tags: ["AI", "LLM", "Research"]
  },
  {
    id: 14,
    title: "Frontend Engineer Intern",
    company: "Linear",
    deadline: "2026-03-05T23:59:59",
    type: "Internship",
    logo: "https://logo.clearbit.com/linear.app?size=80",
    skills: ["React", "TypeScript", "Electron", "Design Systems"],
    description: "Build the issue tracker you wish you had. Focus on craft and performance.",
    expectations: ["Build high-performance UI", "Polish interactions", "Work with the founders"],
    tags: ["Productivity", "Startup", "Craft"]
  },
  {
    id: 15,
    title: "Consulting Intern",
    company: "McKinsey",
    deadline: "2026-01-15T23:59:59",
    type: "Internship",
    logo: "https://logo.clearbit.com/mckinsey.com?size=80",
    skills: ["Strategy", "Excel", "PowerPoint", "Analysis"],
    description: "Solve the toughest problems for the world's biggest organizations.",
    expectations: ["Analyze client data", "Build slide decks", "Present to client leadership"],
    tags: ["Consulting", "Strategy", "Business"]
  }
];
