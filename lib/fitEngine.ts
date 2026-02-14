import { UserProfile } from '@/data/userProfile';

export interface FitResult {
    score: number;
    label: string;
    color: string;
    matchedSkills: string[];
    missingSkills: string[];
}

export interface FitInput {
    skills?: string[];
    tags?: string[];
    [key: string]: any;
}

export const calculateFitScore = (opportunity: FitInput, userProfile: UserProfile): FitResult => {
    // Pure Skill-Based Fit Logic
    // Use skills if available, otherwise fall back to tags
    const requiredSkills = opportunity.skills && opportunity.skills.length > 0
        ? opportunity.skills
        : (opportunity.tags || []);
    const userSkills = userProfile.skills || [];

    // Create sets for O(1) lookup using lowercase
    const userSkillsLower = new Set(userSkills.map(s => s.toLowerCase()));

    // Filter preserving original casing
    const matchedSkills = requiredSkills.filter(skill => userSkillsLower.has(skill.toLowerCase()));
    const missingSkills = requiredSkills.filter(skill => !userSkillsLower.has(skill.toLowerCase()));

    // Calculate Score
    // Guard against division by zero if no skills are required
    const score = requiredSkills.length > 0
        ? Math.round((matchedSkills.length / requiredSkills.length) * 100)
        : 100;

    // Dynamic Coloring based on Score directly
    let color;
    const label = `${score}% Match`;

    if (score >= 80) {
        color = 'bg-emerald-100 text-emerald-700 border-emerald-200';
    } else if (score >= 50) {
        color = 'bg-amber-100 text-amber-700 border-amber-200';
    } else {
        color = 'bg-rose-100 text-rose-700 border-rose-200';
    }

    return {
        score,
        label,
        color,
        matchedSkills,
        missingSkills
    };
};
