import axios from "axios";
import { useQuery } from "@tanstack/react-query";

export type VersionInfo = {
  commitSha: string | null;
  commitRef: string | null;
  commitMessage: string | null;
};

async function fetchVersionInfo(): Promise<VersionInfo> {
  const { data } = await axios.get<VersionInfo>("/api/version");
  return data;
}

export function useVersionInfo() {
  return useQuery<VersionInfo>({
    queryKey: ["version"],
    queryFn: fetchVersionInfo,
    staleTime: Infinity,
    retry: false,
  });
}
