import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import {
  CohortDetailResponse,
  CohortSessionResponse,
} from "@/types/interfaces";

async function fetchCohorts() {
  try {
    const { data } = await axios.get("/api/cohorts");
    return data;
  } catch (error) {
    console.error("Failed to fetch cohorts:", error);
    throw error;
  }
}

async function fetchCohortDetail(cohortId: string): Promise<CohortDetailResponse> {
  try {
    const { data } = await axios.get<CohortDetailResponse>(
      `/api/cohorts/${cohortId}/dashboard`
    );
    return data;
  } catch (error) {
    console.error("Failed to fetch cohort detail:", error);
    throw error;
  }
}

async function fetchCohortSession(
  cohortId: string,
  sessionId: string
): Promise<CohortSessionResponse> {
  try {
    const { data } = await axios.get<CohortSessionResponse>(
      `/api/cohorts/${cohortId}/sessions/${sessionId}`
    );
    return data;
  } catch (error) {
    console.error("Failed to fetch cohort session:", error);
    throw error;
  }
}

export function useCohorts() {
  return useQuery({
    queryKey: ["cohorts"],
    queryFn: fetchCohorts,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCohortDetail(cohortId: string) {
  return useQuery({
    queryKey: ["cohort-detail", cohortId],
    queryFn: () => fetchCohortDetail(cohortId),
    staleTime: 1000 * 60,
  });
}

export function useCohortSession(cohortId: string, sessionId: string) {
  return useQuery({
    queryKey: ["cohort-session", cohortId, sessionId],
    queryFn: () => fetchCohortSession(cohortId, sessionId),
    staleTime: 1000 * 60 * 5,
    enabled: !!sessionId && !!cohortId,
  });
}
