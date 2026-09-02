"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import ProfileForm from "@/components/ProfileForm";
import { ProfileUser } from "@/types/interfaces";

export default function ProfileCard({ user }: { user: ProfileUser }) {
  const [completeness, setCompleteness] = useState<number>(0);

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
        </div>
      </CardHeader>
      <CardContent>
        <ProfileForm user={user} onProgressChange={setCompleteness} />
      </CardContent>
    </Card>
  );
}
