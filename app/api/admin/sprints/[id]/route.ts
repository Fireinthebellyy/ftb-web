import { NextResponse } from "next/server";
import { dbPool, db } from "@/lib/db";
import {
  sprints,
  sprintMentors,
  sprintFeatures,
  sprintTiers,
  sprintAddOns,
  sprintSessions,
  sprintUpgradePlans,
  sprintFaqs,
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
      !canAccessAdminTab(currentUser.currentUser.role, "sprints")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const paramsResolved = await params;
    const id = paramsResolved.id;

    const sprint = await db.query.sprints.findFirst({
      where: eq(sprints.id, id),
    });

    if (!sprint) {
      return NextResponse.json({ error: "Sprint not found" }, { status: 404 });
    }

    const mentorsList = await db
      .select()
      .from(sprintMentors)
      .where(eq(sprintMentors.sprintId, id))
      .orderBy(sprintMentors.orderIndex);

    const featuresList = await db
      .select()
      .from(sprintFeatures)
      .where(eq(sprintFeatures.sprintId, id))
      .orderBy(sprintFeatures.orderIndex);

    const tiersList = await db
      .select()
      .from(sprintTiers)
      .where(eq(sprintTiers.sprintId, id))
      .orderBy(sprintTiers.orderIndex);

    const addonsList = await db
      .select()
      .from(sprintAddOns)
      .where(eq(sprintAddOns.sprintId, id))
      .orderBy(sprintAddOns.orderIndex);

    const sessionsList = await db
      .select()
      .from(sprintSessions)
      .where(eq(sprintSessions.sprintId, id))
      .orderBy(sprintSessions.orderIndex);

    const upgradePlansList = await db
      .select()
      .from(sprintUpgradePlans)
      .where(eq(sprintUpgradePlans.sprintId, id))
      .orderBy(sprintUpgradePlans.orderIndex);

    const faqsList = await db
      .select()
      .from(sprintFaqs)
      .where(eq(sprintFaqs.sprintId, id))
      .orderBy(sprintFaqs.orderIndex);

    return NextResponse.json({
      ...sprint,
      mentors: mentorsList,
      features: featuresList,
      tiers: tiersList,
      addons: addonsList,
      sessions: sessionsList,
      upgradePlans: upgradePlansList,
      faqs: faqsList,
    });
  } catch (error) {
    console.error("Error fetching admin sprint details:", error);
    return NextResponse.json(
      { error: "Failed to fetch sprint details" },
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
      !canAccessAdminTab(currentUser.currentUser.role, "sprints")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const paramsResolved = await params;
    const sprintId = paramsResolved.id;

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
      faqsHeading,
      whoIsThisForHeading,
      whoIsThisForBullets,
      investmentLabel,
      basePrice,
      originalPrice,
      videoUrl,
      toolkitId,
      isActive,
      isBestSeller,
      isFillingFast,
      hasEarlyBird,
      isVerificationRequired,
      showEarlyBirdCheckout,
      showEarlyBirdMarqueeCheckout,
      showAddonsCheckout,
      mentors: incomingMentors = [],
      features: incomingFeatures = [],
      tiers: incomingTiers = [],
      addons: incomingAddons = [],
      sessions: incomingSessions = [],
    } = body;

    const result = await dbPool.transaction(async (tx) => {
      const updatedSprints = await tx
        .update(sprints)
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
          faqsHeading: faqsHeading || "Frequently Asked Questions",
          whoIsThisForHeading: whoIsThisForHeading || null,
          whoIsThisForBullets: whoIsThisForBullets && Array.isArray(whoIsThisForBullets) ? whoIsThisForBullets.filter((b: any) => typeof b === 'string' && b.trim() !== '') : null,
          investmentLabel,
          basePrice: Number(basePrice),
          originalPrice: originalPrice ? Number(originalPrice) : null,
          videoUrl: videoUrl !== undefined ? (videoUrl?.trim() || null) : undefined,
          toolkitId: toolkitId || null,
          isActive: isActive !== undefined ? Boolean(isActive) : true,
          isBestSeller: isBestSeller !== undefined ? Boolean(isBestSeller) : false,
          isFillingFast: isFillingFast !== undefined ? Boolean(isFillingFast) : false,
          hasEarlyBird: hasEarlyBird !== undefined ? Boolean(hasEarlyBird) : false,
          isVerificationRequired: isVerificationRequired !== undefined ? Boolean(isVerificationRequired) : true,
          showEarlyBirdCheckout: Boolean(showEarlyBirdCheckout ?? false),
          showEarlyBirdMarqueeCheckout: Boolean(showEarlyBirdMarqueeCheckout ?? false),
          showAddonsCheckout: Boolean(showAddonsCheckout ?? true),
          updatedAt: new Date(),
        })
        .where(eq(sprints.id, sprintId))
        .returning();

      if (!updatedSprints.length) {
        throw new Error("Sprint not found or update failed");
      }

      // Sync Mentors
      const incomingMentorIds = incomingMentors
        .map((m: any) => m.id)
        .filter(Boolean);
      if (incomingMentorIds.length > 0) {
        await tx
          .delete(sprintMentors)
          .where(
            and(
              eq(sprintMentors.sprintId, sprintId),
              notInArray(sprintMentors.id, incomingMentorIds)
            )
          );
      } else {
        await tx
          .delete(sprintMentors)
          .where(eq(sprintMentors.sprintId, sprintId));
      }

      for (let i = 0; i < incomingMentors.length; i++) {
        const m = incomingMentors[i];
        if (m.id) {
          await tx
            .update(sprintMentors)
            .set({
              name: m.name,
              role: m.role,
              imageUrl: m.imageUrl,
              bio: m.bio,
              link: m.link,
              orderIndex: i,
            })
            .where(and(eq(sprintMentors.id, m.id), eq(sprintMentors.sprintId, sprintId)));
        } else {
          await tx.insert(sprintMentors).values({
            sprintId,
            name: m.name,
            role: m.role,
            imageUrl: m.imageUrl,
            bio: m.bio,
            link: m.link,
            orderIndex: i,
          });
        }
      }

      // Sync Features
      const incomingFeatureIds = incomingFeatures
        .map((f: any) => f.id)
        .filter(Boolean);
      if (incomingFeatureIds.length > 0) {
        await tx
          .delete(sprintFeatures)
          .where(
            and(
              eq(sprintFeatures.sprintId, sprintId),
              notInArray(sprintFeatures.id, incomingFeatureIds)
            )
          );
      } else {
        await tx
          .delete(sprintFeatures)
          .where(eq(sprintFeatures.sprintId, sprintId));
      }

      for (let i = 0; i < incomingFeatures.length; i++) {
        const f = incomingFeatures[i];
        if (f.id) {
          await tx
            .update(sprintFeatures)
            .set({
              icon: f.icon || "Check",
              title: f.title,
              description: f.description,
              orderIndex: i,
            })
            .where(eq(sprintFeatures.id, f.id));
        } else {
          await tx.insert(sprintFeatures).values({
            sprintId,
            icon: f.icon || "Check",
            title: f.title,
            description: f.description,
            orderIndex: i,
          });
        }
      }

      // Sync Tiers
      const incomingTierIds = incomingTiers
        .map((t: any) => t.id)
        .filter(Boolean);
      if (incomingTierIds.length > 0) {
        await tx
          .delete(sprintTiers)
          .where(
            and(
              eq(sprintTiers.sprintId, sprintId),
              notInArray(sprintTiers.id, incomingTierIds)
            )
          );
      } else {
        await tx
          .delete(sprintTiers)
          .where(eq(sprintTiers.sprintId, sprintId));
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
            .update(sprintTiers)
            .set({
              name: t.name,
              price: Number(t.price),
              originalPrice: t.originalPrice ? Number(t.originalPrice) : null,
              description: t.description,
              whatIncluded: whatIncludedArr,
              isDefault: Boolean(t.isDefault),
              orderIndex: i,
            })
            .where(eq(sprintTiers.id, t.id));
        } else {
          await tx.insert(sprintTiers).values({
            sprintId,
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

      // Sync Addons
      const incomingAddonIds = incomingAddons
        .map((a: any) => a.id)
        .filter(Boolean);
      if (incomingAddonIds.length > 0) {
        await tx
          .delete(sprintAddOns)
          .where(
            and(
              eq(sprintAddOns.sprintId, sprintId),
              notInArray(sprintAddOns.id, incomingAddonIds)
            )
          );
      } else {
        await tx
          .delete(sprintAddOns)
          .where(eq(sprintAddOns.sprintId, sprintId));
      }

      for (let i = 0; i < incomingAddons.length; i++) {
        const a = incomingAddons[i];
        if (a.id) {
          await tx
            .update(sprintAddOns)
            .set({
              name: a.name,
              priceDelta: Number(a.priceDelta),
              description: a.description,
              orderIndex: i,
            })
            .where(eq(sprintAddOns.id, a.id));
        } else {
          await tx.insert(sprintAddOns).values({
            sprintId,
            name: a.name,
            priceDelta: Number(a.priceDelta),
            description: a.description,
            orderIndex: i,
          });
        }
      }

      // Sync Sessions
      const incomingSessionIds = incomingSessions
        .map((s: any) => s.id)
        .filter(Boolean);
      if (incomingSessionIds.length > 0) {
        await tx
          .delete(sprintSessions)
          .where(
            and(
              eq(sprintSessions.sprintId, sprintId),
              notInArray(sprintSessions.id, incomingSessionIds)
            )
          );
      } else {
        await tx
          .delete(sprintSessions)
          .where(eq(sprintSessions.sprintId, sprintId));
      }

      for (let i = 0; i < incomingSessions.length; i++) {
        const s = incomingSessions[i];
        if (s.id) {
          await tx
            .update(sprintSessions)
            .set({
              title: s.title,
              description: s.description,
              price: s.price ? Number(s.price) : null,
              originalPrice: s.originalPrice ? Number(s.originalPrice) : null,
              orderIndex: i,
              showInDashboard: s.showInDashboard !== undefined ? Boolean(s.showInDashboard) : true,
              showInHome: s.showInHome !== undefined ? Boolean(s.showInHome) : true,
            })
            .where(eq(sprintSessions.id, s.id));
        } else {
          await tx.insert(sprintSessions).values({
            sprintId,
            title: s.title,
            description: s.description,
            price: s.price ? Number(s.price) : null,
            originalPrice: s.originalPrice ? Number(s.originalPrice) : null,
            orderIndex: i,
            showInDashboard: s.showInDashboard !== undefined ? Boolean(s.showInDashboard) : true,
            showInHome: s.showInHome !== undefined ? Boolean(s.showInHome) : true,
          });
        }
      }

      return updatedSprints[0];
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error updating sprint config:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update sprint" },
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
      !canAccessAdminTab(currentUser.currentUser.role, "sprints")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const paramsResolved = await params;
    const id = paramsResolved.id;

    await db.delete(sprints).where(eq(sprints.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting sprint:", error);
    return NextResponse.json(
      { error: "Failed to delete sprint" },
      { status: 500 }
    );
  }
}
