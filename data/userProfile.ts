export interface UserProfile {
    name: string;
    major: string;
    year: string;
    skills: string[];
    interests: string[];
    maxActiveApps: number;
}

export const userProfile: UserProfile = {
    name: "Anchit Goel",
    major: "Computer Science",
    year: "Junior",
    skills: ["React", "JavaScript", "Figma", "Product Thinking", "Python"],
    interests: ["Design", "Startups", "Frontend", "AI"],
    maxActiveApps: 3
};
