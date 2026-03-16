import { InternshipData, ApplyModalOpportunity } from "@/types/interfaces";

export const mapInternshipToApplyOpportunity = (
  period: InternshipData
): ApplyModalOpportunity => {
  return {
    ...period,
    id: period.id,
    title: period.title,
    hiringOrganization: period.hiringOrganization,
    company: period.hiringOrganization,
    poster: period.poster || undefined,
    logo: period.poster || undefined,
    skills: period.tags,
    tags: period.tags,
    returnUrl: `/intern/${period.id}`,
  };
};
