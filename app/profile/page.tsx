import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user as userTable } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import ProfileForm from "@/components/ProfileForm";

export default async function ProfilePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
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
    redirect("/login");
  }

  const dobStr = current.dateOfBirth
    ? typeof current.dateOfBirth === "string"
      ? current.dateOfBirth
      : new Date(current.dateOfBirth as unknown as string).toISOString().split("T")[0]
    : null;

  return (
    <div className="container max-w-2xl mx-auto px-4 py-8 h-full grow">
      <h1 className="text-2xl font-semibold mb-6">Your Profile</h1>
      <ProfileForm
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
  );
}
