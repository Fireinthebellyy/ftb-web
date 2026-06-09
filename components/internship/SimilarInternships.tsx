"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchInternshipsPaginated } from "@/lib/queries-internships";
import { toTitleCase } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import InternshipPost from "@/components/InternshipCard";
import { Internship } from "@/types/interfaces";

interface SimilarInternshipsProps {
  currentId: string;
  field?: string | null;
  title?: string;
  exactFieldOnly?: boolean;
}

const FIELD_SIMILARITY_MAP: Record<string, string[]> = {
  generalist: ["strategy_consulting", "research_policy", "product"],
  tech: ["ml_ai", "data"],
  data: ["tech", "ml_ai", "research_policy"],
  ml_ai: ["tech", "data"],
  design: ["generalist", "data"],
  product: ["generalist", "strategy_consulting", "research_policy"],
  strategy_consulting: ["generalist", "product", "research_policy", "biz_dev_sales"],
  operations_supply_chain: ["strategy_consulting", "generalist", "research_policy"],
  marketing_media: ["generalist", "strategy_consulting", "research_policy"],
  finance: ["strategy_consulting", "generalist", "biz_dev_sales"],
  hr_talent: ["operations_supply_chain", "biz_dev_sales"],
  research_policy: ["legal"],
  biz_dev_sales: [],
  legal: ["research_policy"],
};

const FIELD_LABELS: Record<string, string> = {
  generalist: "Generalist",
  tech: "Tech",
  data: "Data",
  ml_ai: "Machine Learning / AI",
  design: "Design",
  product: "Product",
  strategy_consulting: "Strategy & Consulting",
  operations_supply_chain: "Operations & Supply Chain",
  marketing_media: "Marketing & Media",
  finance: "Finance",
  hr_talent: "HR/Talent Acquisition",
  research_policy: "Research & Policy",
  biz_dev_sales: "Business Development & Sales",
  legal: "Legal",
};

const resolveField = (field: string | null | undefined, title?: string): string => {
  if (field && field.trim()) {
    return field.toLowerCase();
  }
  if (!title) return "generalist";
  const t = title.toLowerCase();
  if (
    t.includes("develop") ||
    t.includes("software") ||
    t.includes("engineer") ||
    t.includes("tech") ||
    t.includes("frontend") ||
    t.includes("backend") ||
    t.includes("fullstack") ||
    t.includes("programmer") ||
    t.includes("coding")
  )
    return "tech";
  if (
    t.includes("design") ||
    t.includes("ui") ||
    t.includes("ux") ||
    t.includes("visual") ||
    t.includes("creative") ||
    t.includes("graphic")
  )
    return "design";
  if (
    t.includes("market") ||
    t.includes("seo") ||
    t.includes("social") ||
    t.includes("content") ||
    t.includes("media") ||
    t.includes("copywrit")
  )
    return "marketing_media";
  if (
    t.includes("machine") ||
    t.includes("ai") ||
    t.includes("artificial intelligence") ||
    t.includes("learning") ||
    t.includes("deep learning")
  )
    return "ml_ai";
  if (
    t.includes("data") ||
    t.includes("analy") ||
    t.includes("database") ||
    t.includes("business intelligence")
  )
    return "data";
  if (
    t.includes("finance") ||
    t.includes("account") ||
    t.includes("audit") ||
    t.includes("tax") ||
    t.includes("investment") ||
    t.includes("wealth") ||
    t.includes("banking")
  )
    return "finance";
  if (
    t.includes("hr") ||
    t.includes("talent") ||
    t.includes("recruit") ||
    t.includes("people") ||
    t.includes("acquisition")
  )
    return "hr_talent";
  if (
    t.includes("product") ||
    t.includes("pm") ||
    t.includes("manager") ||
    t.includes("owner")
  )
    return "product";
  if (
    t.includes("sales") ||
    t.includes("biz") ||
    t.includes("business development") ||
    t.includes("selling") ||
    t.includes("growth")
  )
    return "biz_dev_sales";
  if (
    t.includes("legal") ||
    t.includes("law") ||
    t.includes("attorney") ||
    t.includes("compliance")
  )
    return "legal";
  
  return "generalist";
};

const getFields = (fieldString?: string | null): string[] => {
  if (!fieldString) return [];
  return fieldString
    .split(/[,|]/)
    .map((f) => f.trim().toLowerCase())
    .filter(Boolean);
};

export const SimilarInternships: React.FC<SimilarInternshipsProps> = ({
  currentId,
  field,
  title = "",
  exactFieldOnly = false,
}) => {
  const { data, isLoading } = useQuery({
    queryKey: ["internships", "similar-recommender", currentId, field, title, exactFieldOnly],
    queryFn: async () => {
      const primaryField = field || resolveField(field, title);
      const currentFields = getFields(primaryField);

      // Union similar-field lists and deduplicate them, preserving priority order
      let similarFieldsList: string[] = [];
      if (exactFieldOnly) {
        similarFieldsList = [...currentFields];
      } else {
        // Include all entries from currentFields first
        currentFields.forEach((f) => {
          if (!similarFieldsList.includes(f)) {
            similarFieldsList.push(f);
          }
        });
        // Append mapped related fields from FIELD_SIMILARITY_MAP
        currentFields.forEach((f) => {
          const mapped = FIELD_SIMILARITY_MAP[f] || [];
          mapped.forEach((simField) => {
            if (!similarFieldsList.includes(simField)) {
              similarFieldsList.push(simField);
            }
          });
        });
      }

      let isFallback = false;
      // Rule 5: If no similar-field matches exist, fallback to generalist
      if (similarFieldsList.length === 0) {
        similarFieldsList = ["generalist"];
        isFallback = true;
      }

      let results: Internship[] = [];
      try {
        const response = await fetchInternshipsPaginated(
          24, // Generous limit to fetch sufficient results for ranking
          0,
          undefined,
          [],
          [],
          undefined,
          undefined,
          undefined,
          undefined,
          similarFieldsList
        );
        results = response.internships || [];
      } catch (e) {
        console.error("Error fetching similar internships:", e);
      }

      // Rule 5 fallback: If we searched but got 0 matches, fallback to generalist listings
      if (results.length === 0 && !isFallback) {
        try {
          similarFieldsList = ["generalist"];
          isFallback = true;
          const responseFallback = await fetchInternshipsPaginated(
            24,
            0,
            undefined,
            [],
            [],
            undefined,
            undefined,
            undefined,
            undefined,
            ["generalist"]
          );
          results = responseFallback.internships || [];
        } catch (e) {
          console.error("Error fetching fallback generalist internships:", e);
        }
      }

      // Rule 4: Never recommend an internship the user is already viewing
      results = results.filter((item) => item && item.id !== currentId);

      // Rule 2: Rank results by order of similarity (first similar field = highest relevance)
      results.sort((a, b) => {
        const aField = (a.field || "").toLowerCase();
        const bField = (b.field || "").toLowerCase();

        let aIndex = similarFieldsList.indexOf(aField);
        let bIndex = similarFieldsList.indexOf(bField);

        // If not found in the exact list, try partial match or set to fallback high index
        if (aIndex === -1) {
          aIndex = similarFieldsList.findIndex((f) => aField.includes(f));
        }
        if (bIndex === -1) {
          bIndex = similarFieldsList.findIndex((f) => bField.includes(f));
        }

        if (aIndex === -1) aIndex = 999;
        if (bIndex === -1) bIndex = 999;

        return aIndex - bIndex;
      });

      // Deduplicate by ID
      const seen = new Set<string>();
      const finalResults = [];
      for (const item of results) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          finalResults.push(item);
        }
      }

      return {
        internships: finalResults.slice(0, 5),
        similarFields: similarFieldsList,
        isFallback,
      };
    },
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return (
      <div className="mt-8 mb-6 w-full">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-6 w-64 rounded-md" />
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-[300px] sm:w-[340px] md:w-[380px] shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-3"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <Skeleton className="h-9 w-9 shrink-0 rounded-full sm:h-11 sm:w-11" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 w-[70%]" />
                    <Skeleton className="h-3 w-[45%]" />
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || !data.internships || data.internships.length === 0) return null;

  const { internships: similarInternships, similarFields, isFallback } = data;

  // Rule 6: Label recommendations clearly
  let label = "Similar Internships";
  if (isFallback) {
    label = "Similar internships in Generalist";
  } else {
    const labelNames = similarFields.map(
      (f) => FIELD_LABELS[f] || toTitleCase(f.replace(/_/g, " "))
    );
    if (labelNames.length > 0) {
      label = `Similar internships in ${labelNames.join(", ")}`;
    } else {
      label = "Similar internships";
    }
  }

  return (
    <div className="mt-10 mb-8 w-full">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-base font-extrabold text-slate-900 md:text-lg tracking-tight">
            {label}
          </h3>
          <div className="h-0.5 w-12 rounded-full bg-[#ec5b13]/80" />
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
        {similarInternships.map((internship) => (
          <div
            key={internship.id}
            className="w-[300px] sm:w-[340px] md:w-[380px] shrink-0 snap-start"
          >
            <InternshipPost internship={internship} isActionsHidden={true} />
          </div>
        ))}
      </div>
    </div>
  );
};
