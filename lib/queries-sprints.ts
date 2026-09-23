import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import {
  SprintDetailResponse,
  SprintSessionResponse,
} from "@/types/interfaces";

async function fetchSprints() {
  try {
    const { data } = await axios.get("/api/sprints");
    return data;
  } catch (error) {
    console.error("Failed to fetch sprints:", error);
    throw error;
  }
}

async function fetchSprintDetail(sprintId: string): Promise<SprintDetailResponse> {
  try {
    const { data } = await axios.get<SprintDetailResponse>(
      `/api/sprints/${sprintId}/dashboard`
    );
    return data;
  } catch (error) {
    console.error("Failed to fetch sprint detail:", error);
    throw error;
  }
}

async function fetchSprintSession(
  sprintId: string,
  sessionId: string
): Promise<SprintSessionResponse> {
  try {
    const { data } = await axios.get<SprintSessionResponse>(
      `/api/sprints/${sprintId}/sessions/${sessionId}`
    );
    return data;
  } catch (error) {
    console.error("Failed to fetch sprint session:", error);
    throw error;
  }
}

export function useSprints() {
  return useQuery({
    queryKey: ["sprints"],
    queryFn: fetchSprints,
    staleTime: 1000 * 60 * 5,
  });
}

export function useSprintDetail(sprintId: string) {
  return useQuery({
    queryKey: ["sprint-detail", sprintId],
    queryFn: () => fetchSprintDetail(sprintId),
    staleTime: 1000 * 60,
  });
}

export function useSprintSession(sprintId: string, sessionId: string) {
  return useQuery({
    queryKey: ["sprint-session", sprintId, sessionId],
    queryFn: () => fetchSprintSession(sprintId, sessionId),
    staleTime: 1000 * 60 * 5,
    enabled: !!sessionId && !!sprintId,
  });
}
