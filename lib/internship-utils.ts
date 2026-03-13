import { InternshipData } from "@/types/interfaces";
import { ApplyModalOpportunity } from "@/components/tracker/ApplyModal";

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
