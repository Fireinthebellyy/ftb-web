import { Opportunity } from '@/data/opportunities';
import { UserProfile } from '@/data/userProfile';

export interface FitResult {
    score: number;
    label: string;
    color: string;
    matchedSkills: string[];
    missingSkills: string[];
}

export const calculateFitScore = (opportunity: Opportunity, userProfile: UserProfile): FitResult => {
    // Pure Skill-Based Fit Logic
    const requiredSkills = (opportunity.skills || []).map(s => s.toLowerCase());
    const userSkills = (userProfile.skills || []).map(s => s.toLowerCase());

    if (requiredSkills.length === 0) {
        return {
            score: 0,
            label: 'No Skills Listed',
            color: 'bg-slate-100 text-slate-500 border-slate-200',
            matchedSkills: [],
            missingSkills: []
        };
    }

    const matchedSkills = requiredSkills.filter(skill => userSkills.includes(skill));
    const missingSkills = requiredSkills.filter(skill => !userSkills.includes(skill));

    // Calculate Score
    const score = Math.round((matchedSkills.length / requiredSkills.length) * 100);

    // Dynamic Coloring based on Score directly
    let color = 'bg-slate-100 text-slate-600 border-slate-200';
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
