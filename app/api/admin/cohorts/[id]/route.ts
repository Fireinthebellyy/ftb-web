import { NextResponse } from "next/server";
import { dbPool, db } from "@/lib/db";
import {
  cohorts,
  cohortMentors,
  cohortFeatures,
  cohortTiers,
  cohortAddOns,
  cohortSessions,
} from "@/lib/schema";
import { getCurrentUser } from "@/server/users";
import { canAccessAdminTab } from "@/lib/admin-permissions";
import { eq, and, notInArray } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (
      !currentUser ||
      !currentUser.currentUser?.id ||
      !canAccessAdminTab(currentUser.currentUser.role, "toolkits")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const paramsResolved = await params;
    const id = paramsResolved.id;

    const cohort = await db.query.cohorts.findFirst({
      where: eq(cohorts.id, id),
    });

    if (!cohort) {
      return NextResponse.json({ error: "Cohort not found" }, { status: 404 });
    }

    const mentorsList = await db
      .select()
      .from(cohortMentors)
      .where(eq(cohortMentors.cohortId, id))
      .orderBy(cohortMentors.orderIndex);

    const featuresList = await db
      .select()
      .from(cohortFeatures)
      .where(eq(cohortFeatures.cohortId, id))
      .orderBy(cohortFeatures.orderIndex);

    const tiersList = await db
      .select()
      .from(cohortTiers)
      .where(eq(cohortTiers.cohortId, id))
      .orderBy(cohortTiers.orderIndex);

    const addonsList = await db
      .select()
      .from(cohortAddOns)
      .where(eq(cohortAddOns.cohortId, id))
      .orderBy(cohortAddOns.orderIndex);

    const sessionsList = await db
      .select()
      .from(cohortSessions)
      .where(eq(cohortSessions.cohortId, id))
      .orderBy(cohortSessions.orderIndex);

    return NextResponse.json({
      ...cohort,
      mentors: mentorsList,
      features: featuresList,
      tiers: tiersList,
      addons: addonsList,
      sessions: sessionsList,
    });
  } catch (error) {
    console.error("Error fetching admin cohort details:", error);
    return NextResponse.json(
      { error: "Failed to fetch cohort details" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (
      !currentUser ||
      !currentUser.currentUser?.id ||
      !canAccessAdminTab(currentUser.currentUser.role, "toolkits")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const paramsResolved = await params;
    const cohortId = paramsResolved.id;

    const body = await request.json();
    const {
      title,
      slug,
      badge1,
      badge2,
      subtitle,
      coverImageUrl,
      coverImageUrls,
      cardImageUrl,
      startDate,
      highlights,
      mentorsHeading,
      mentorsLinkTarget,
      mentorsLimit,
      featuresHeading,
      sessionsHeading,
      testimonialsHeading,
      whoIsThisForHeading,
      whoIsThisForBullets,
      investmentLabel,
      basePrice,
      originalPrice,
      toolkitId,
      isActive,
      isBestSeller,
      isFillingFast,
      hasEarlyBird,
      isVerificationRequired,
      mentors: incomingMentors = [],
      features: incomingFeatures = [],
      tiers: incomingTiers = [],
      addons: incomingAddons = [],
      sessions: incomingSessions = [],
    } = body;

    // Run transaction
    const result = await dbPool.transaction(async (tx) => {
      // 1. Update Cohort base fields
      const updatedCohorts = await tx
        .update(cohorts)
        .set({
          title,
          slug: slug?.toLowerCase().replace(/[^a-z0-9-_]/g, ""),
          badge1,
          badge2,
          subtitle,
          coverImageUrl: coverImageUrl || null,
          coverImageUrls: coverImageUrls && Array.isArray(coverImageUrls) ? coverImageUrls.filter((url: any) => typeof url === 'string' && url.trim() !== '') : null,
          cardImageUrl: cardImageUrl || null,
          startDate: startDate || null,
          highlights: highlights || null,
          mentorsHeading,
          mentorsLinkTarget,
          mentorsLimit: mentorsLimit ? Number(mentorsLimit) : 4,
          featuresHeading,
          sessionsHeading: sessionsHeading || null,
          testimonialsHeading: testimonialsHeading || null,
          whoIsThisForHeading: whoIsThisForHeading || null,
          whoIsThisForBullets: whoIsThisForBullets && Array.isArray(whoIsThisForBullets) ? whoIsThisForBullets.filter((b: any) => typeof b === 'string' && b.trim() !== '') : null,
          investmentLabel,
          basePrice: Number(basePrice),
          originalPrice: originalPrice ? Number(originalPrice) : null,
          toolkitId: toolkitId || null,
          isActive: isActive !== undefined ? Boolean(isActive) : true,
          isBestSeller: isBestSeller !== undefined ? Boolean(isBestSeller) : false,
          isFillingFast: isFillingFast !== undefined ? Boolean(isFillingFast) : false,
          hasEarlyBird: hasEarlyBird !== undefined ? Boolean(hasEarlyBird) : false,
          isVerificationRequired: isVerificationRequired !== undefined ? Boolean(isVerificationRequired) : true,
          updatedAt: new Date(),
        })
        .where(eq(cohorts.id, cohortId))
        .returning();

      if (!updatedCohorts.length) {
        throw new Error("Cohort not found or update failed");
      }

      // 2. Sync Mentors
      const incomingMentorIds = incomingMentors
        .map((m: any) => m.id)
        .filter(Boolean);
      if (incomingMentorIds.length > 0) {
        await tx
          .delete(cohortMentors)
          .where(
            and(
              eq(cohortMentors.cohortId, cohortId),
              notInArray(cohortMentors.id, incomingMentorIds)
            )
          );
      } else {
        await tx
          .delete(cohortMentors)
          .where(eq(cohortMentors.cohortId, cohortId));
      }

      for (let i = 0; i < incomingMentors.length; i++) {
        const m = incomingMentors[i];
        if (m.id) {
          await tx
            .update(cohortMentors)
            .set({
              name: m.name,
              role: m.role,
              imageUrl: m.imageUrl,
              bio: m.bio,
              link: m.link,
              orderIndex: i,
            })
            .where(and(eq(cohortMentors.id, m.id), eq(cohortMentors.cohortId, cohortId)));
        } else {
          await tx.insert(cohortMentors).values({
            cohortId,
            name: m.name,
            role: m.role,
            imageUrl: m.imageUrl,
            bio: m.bio,
            link: m.link,
            orderIndex: i,
          });
        }
      }

      // 3. Sync Features
      const incomingFeatureIds = incomingFeatures
        .map((f: any) => f.id)
        .filter(Boolean);
      if (incomingFeatureIds.length > 0) {
        await tx
          .delete(cohortFeatures)
          .where(
            and(
              eq(cohortFeatures.cohortId, cohortId),
              notInArray(cohortFeatures.id, incomingFeatureIds)
            )
          );
      } else {
        await tx
          .delete(cohortFeatures)
          .where(eq(cohortFeatures.cohortId, cohortId));
      }

      for (let i = 0; i < incomingFeatures.length; i++) {
        const f = incomingFeatures[i];
        if (f.id) {
          await tx
            .update(cohortFeatures)
            .set({
              icon: f.icon || "Check",
              title: f.title,
              description: f.description,
              orderIndex: i,
            })
            .where(eq(cohortFeatures.id, f.id));
        } else {
          await tx.insert(cohortFeatures).values({
            cohortId,
            icon: f.icon || "Check",
            title: f.title,
            description: f.description,
            orderIndex: i,
          });
        }
      }

      // 4. Sync Tiers
      const incomingTierIds = incomingTiers
        .map((t: any) => t.id)
        .filter(Boolean);
      if (incomingTierIds.length > 0) {
        await tx
          .delete(cohortTiers)
          .where(
            and(
              eq(cohortTiers.cohortId, cohortId),
              notInArray(cohortTiers.id, incomingTierIds)
            )
          );
      } else {
        await tx
          .delete(cohortTiers)
          .where(eq(cohortTiers.cohortId, cohortId));
      }

      for (let i = 0; i < incomingTiers.length; i++) {
        const t = incomingTiers[i];
        const whatIncludedArr = Array.isArray(t.whatIncluded)
          ? t.whatIncluded
          : typeof t.whatIncluded === "string"
          ? t.whatIncluded.split(",").map((s: string) => s.trim()).filter(Boolean)
          : [];

        if (t.id) {
          await tx
            .update(cohortTiers)
            .set({
              name: t.name,
              price: Number(t.price),
              originalPrice: t.originalPrice ? Number(t.originalPrice) : null,
              description: t.description,
              whatIncluded: whatIncludedArr,
              isDefault: Boolean(t.isDefault),
              orderIndex: i,
            })
            .where(eq(cohortTiers.id, t.id));
        } else {
          await tx.insert(cohortTiers).values({
            cohortId,
            name: t.name,
            price: Number(t.price),
            originalPrice: t.originalPrice ? Number(t.originalPrice) : null,
            description: t.description,
            whatIncluded: whatIncludedArr,
            isDefault: Boolean(t.isDefault),
            orderIndex: i,
          });
        }
      }

      // 5. Sync Addons
      const incomingAddonIds = incomingAddons
        .map((a: any) => a.id)
        .filter(Boolean);
      if (incomingAddonIds.length > 0) {
        await tx
          .delete(cohortAddOns)
          .where(
            and(
              eq(cohortAddOns.cohortId, cohortId),
              notInArray(cohortAddOns.id, incomingAddonIds)
            )
          );
      } else {
        await tx
          .delete(cohortAddOns)
          .where(eq(cohortAddOns.cohortId, cohortId));
      }

      for (let i = 0; i < incomingAddons.length; i++) {
        const a = incomingAddons[i];
        if (a.id) {
          await tx
            .update(cohortAddOns)
            .set({
              name: a.name,
              priceDelta: Number(a.priceDelta),
              description: a.description,
              orderIndex: i,
            })
            .where(eq(cohortAddOns.id, a.id));
        } else {
          await tx.insert(cohortAddOns).values({
            cohortId,
            name: a.name,
            priceDelta: Number(a.priceDelta),
            description: a.description,
            orderIndex: i,
          });
        }
      }
      // 6. Sync Sessions
      const incomingSessionIds = incomingSessions
        .map((s: any) => s.id)
        .filter(Boolean);
      if (incomingSessionIds.length > 0) {
        await tx
          .delete(cohortSessions)
          .where(
            and(
              eq(cohortSessions.cohortId, cohortId),
              notInArray(cohortSessions.id, incomingSessionIds)
            )
          );
      } else {
        await tx
          .delete(cohortSessions)
          .where(eq(cohortSessions.cohortId, cohortId));
      }

      for (let i = 0; i < incomingSessions.length; i++) {
        const s = incomingSessions[i];
        if (s.id) {
          await tx
            .update(cohortSessions)
            .set({
              title: s.title,
              description: s.description,
              price: s.price ? Number(s.price) : null,
              originalPrice: s.originalPrice ? Number(s.originalPrice) : null,
              orderIndex: i,
            })
            .where(eq(cohortSessions.id, s.id));
        } else {
          await tx.insert(cohortSessions).values({
            cohortId,
            title: s.title,
            description: s.description,
            price: s.price ? Number(s.price) : null,
            originalPrice: s.originalPrice ? Number(s.originalPrice) : null,
            orderIndex: i,
          });
        }
      }

      return updatedCohorts[0];
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error updating cohort config:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update cohort" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (
      !currentUser ||
      !currentUser.currentUser?.id ||
      !canAccessAdminTab(currentUser.currentUser.role, "toolkits")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const paramsResolved = await params;
    const id = paramsResolved.id;

    await db.delete(cohorts).where(eq(cohorts.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting cohort:", error);
    return NextResponse.json(
      { error: "Failed to delete cohort" },
      { status: 500 }
    );
  }
}
