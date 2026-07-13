import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import {
  CohortDetailResponse,
  CohortSessionResponse,
} from "@/types/interfaces";

async function fetchCohortDetail(cohortId: string): Promise<CohortDetailResponse> {
  const { data } = await axios.get<CohortDetailResponse>(
    `/api/cohorts/${cohortId}/dashboard`
  );
  return data;
}

async function fetchCohortSession(
  cohortId: string,
  sessionId: string
): Promise<CohortSessionResponse> {
  const { data } = await axios.get<CohortSessionResponse>(
    `/api/cohorts/${cohortId}/sessions/${sessionId}`
  );
  return data;
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
  });
}
