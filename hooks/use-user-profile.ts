"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { ProfileUser } from "@/types/interfaces";

export function useUserProfile() {
    return useQuery({
        queryKey: ["user-profile"],
        queryFn: async () => {
            const { data } = await axios.get<{ user: ProfileUser }>("/api/profile");
            return data.user;
        },
        staleTime: 5 * 60 * 1000,
    });
}
