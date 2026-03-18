import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user as userTable } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import ProfileCard from "@/components/profile/ProfileCard";
import FeedbackWidget from "@/components/FeedbackWidget";

export default async function ProfilePage() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      console.log("[ProfilePage] No session found, redirecting to login");
      redirect("/login");
    }

    const current = await db.query.user.findFirst({
      where: eq(userTable.id, session.user.id),
      columns: {
        id: true,
        name: true,
        email: true,
        image: true,
        fieldInterests: true,
        opportunityInterests: true,
        dateOfBirth: true,
        collegeInstitute: true,
        contactNumber: true,
        currentRole: true,
      },
    });

    if (!current) {
      console.log("[ProfilePage] User not found in DB for session ID:", session.user.id);
      redirect("/login");
    }

    let dobStr = null;
    try {
      if (current.dateOfBirth) {
        if (typeof current.dateOfBirth === "string") {
          dobStr = current.dateOfBirth;
        } else {
          dobStr = new Date(current.dateOfBirth).toISOString().split("T")[0];
        }
      }
    } catch (e) {
      console.error("[ProfilePage] Error parsing dateOfBirth:", e);
    }

    return (
      <div
        className="relative min-h-[calc(100vh-64px)] w-full bg-neutral-100"
        aria-label="Profile background"
      >
        <div className="absolute inset-0 -z-10 bg-black/10" aria-hidden="true" />
        <div className="container mx-auto px-4 pt-2 pb-4 md:py-8">
          <div className="mx-auto max-w-3xl">
            <ProfileCard
              user={{
                id: current.id,
                name: current.name ?? "",
                email: current.email ?? "",
                image: current.image ?? "",
                fieldInterests: current.fieldInterests ?? [],
                opportunityInterests: current.opportunityInterests ?? [],
                dateOfBirth: dobStr,
                collegeInstitute: current.collegeInstitute ?? null,
                contactNumber: current.contactNumber ?? null,
                currentRole: current.currentRole ?? null,
              }}
            />
          </div>
        </div>
        <FeedbackWidget />
      </div>
    );
  } catch (error: any) {
    if (error.digest === 'DYNAMIC_SERVER_USAGE') {
      throw error;
    }
    console.error("[ProfilePage] Critical failure:", error);
    throw error;
  }
}
