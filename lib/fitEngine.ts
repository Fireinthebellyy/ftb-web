
export interface FitInput {
    skills?: string[];
    tags?: string[];
    [key: string]: any;
}

export interface FitResult {
    score: number;
    label: string;
    color: string;
    missingSkills: string[];
}

export const calculateFitScore = (opportunity: FitInput, userProfile: any): FitResult => {
    if (!userProfile || !userProfile.skills) {
        return { score: 0, label: 'No Profile', color: 'bg-slate-100 text-slate-500', missingSkills: [] };
    }

    const oppSkills = (opportunity.skills || []).map(s => s.toLowerCase());
    const oppTags = (opportunity.tags || []).map(t => t.toLowerCase());

    // Combine useful keywords from opportunity
    const keyTerms = new Set([...oppSkills, ...oppTags]);
    if (keyTerms.size === 0) {
        return { score: 100, label: 'Open', color: 'bg-emerald-50 text-emerald-700', missingSkills: [] };
    }

    const userSkills = new Set((userProfile.skills || []).map((s: string) => s.toLowerCase()));

    let matchCount = 0;
    const missingSkills: string[] = [];

    keyTerms.forEach(term => {
        if (userSkills.has(term)) {
            matchCount++;
        } else {
            missingSkills.push(term);
        }
    });

    const score = Math.round((matchCount / keyTerms.size) * 100);

    let label = 'Low Match';
    let color = 'bg-rose-50 text-rose-700';

    if (score >= 80) {
        label = 'High Match';
        color = 'bg-emerald-50 text-emerald-700';
    } else if (score >= 50) {
        label = 'Medium Match';
        color = 'bg-amber-50 text-amber-700';
    }

    return { score, label, color, missingSkills };
};
