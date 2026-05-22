"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import ProfileForm from "@/components/ProfileForm";
import { ProfileUser } from "@/types/interfaces";

export default function ProfileCard({ user }: { user: ProfileUser }) {
  const [completeness, setCompleteness] = useState<number>(0);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="mb-2">
          <div className="flex items-center justify-end text-sm text-muted-foreground mb-1">    
            <span>{completeness}%</span>
          </div>
          <Progress value={completeness} className="h-2" />
        </div>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl">Your Profile</CardTitle>
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition-all hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-slate-100 shadow-sm active:scale-95 cursor-pointer"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-4.5 w-4.5 text-[#ec5b13] transition-all duration-300 rotate-0 hover:rotate-45" />
              ) : (
                <Moon className="h-4.5 w-4.5 text-slate-700 transition-all duration-300 hover:-rotate-12" />
              )}
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ProfileForm user={user} onProgressChange={setCompleteness} />
      </CardContent>
    </Card>
  );
}
