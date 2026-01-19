import axios from "axios";
import { useMutation, useQuery } from "@tanstack/react-query";

export type OnboardingProfile = {
  persona?: "student" | "society";
  locationType?: "city" | "state" | null;
  locationValue?: string | null;
  educationLevel?: string | null;
  fieldOfStudy?: string | null;
  fieldOther?: string | null;
  opportunityInterests?: string[] | null;
  domainPreferences?: string[] | null;
  struggles?: string[] | null;
};

export type SaveOnboardingProfileInput = {
  persona: "student" | "society";
  locationType?: "city" | "state";
  locationValue?: string;
  educationLevel?: string;
  fieldOfStudy?: string;
  fieldOther?: string;
  opportunityInterests?: string[];
  domainPreferences?: string[];
  struggles?: string[];
};

export async function fetchOnboardingProfile(): Promise<OnboardingProfile | null> {
  try {
    const { data } = await axios.get<{ profile?: OnboardingProfile }>(
      "/api/onboarding"
    );
    return data?.profile ?? null;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      return null;
    }
    throw error;
  }
}

export async function saveOnboardingProfile(
  payload: SaveOnboardingProfileInput
): Promise<OnboardingProfile> {
  const { data } = await axios.post<{ profile: OnboardingProfile }>(
    "/api/onboarding",
    payload
  );
  return data.profile;
}

export function useOnboardingProfile() {
  return useQuery<OnboardingProfile | null>({
    queryKey: ["onboarding-profile"],
    queryFn: fetchOnboardingProfile,
    staleTime: 1000 * 60 * 5,
  });
}

export function useSaveOnboardingProfile() {
  return useMutation({
    mutationFn: (payload: SaveOnboardingProfileInput) =>
      saveOnboardingProfile(payload),
  });
}
