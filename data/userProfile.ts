export interface UserProfile {
    name: string;
    major: string;
    year: string;
    skills: string[];
    interests: string[];
    maxActiveApps: number;
}

export const DEFAULT_USER_PROFILE: UserProfile = {
    name: "Student Name",
    major: "Major",
    year: "Year",
    skills: ["Skill 1", "Skill 2"],
    interests: ["Interest 1", "Interest 2"],
    maxActiveApps: 3
};

export const getUserProfile = async (): Promise<UserProfile> => {
    // In a real app, this would fetch from an API or database
    // For now, return the default profile
    return DEFAULT_USER_PROFILE;
};
