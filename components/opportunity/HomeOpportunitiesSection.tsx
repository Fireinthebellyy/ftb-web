"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";

interface OpportunityHomeItem {
  id: string;
  title: string;
}

interface OpportunitiesHomeResponse {
  opportunities: OpportunityHomeItem[];
}

interface HomeOpportunitiesSectionProps {
  outfitClass: string;
  sfProClass: string;
}

export default function HomeOpportunitiesSection({
  outfitClass,
  sfProClass,
}: HomeOpportunitiesSectionProps) {
  const limit = 8;
  const offset = 0;

  const { data, isPending, isError } = useQuery<OpportunitiesHomeResponse>({
    queryKey: ["opportunities-home", limit, offset],
    queryFn: async () => {
      const featuredResponse = await axios.get<OpportunitiesHomeResponse>(
        "/api/opportunities/public",
        {
          params: { limit, offset, featured: true },
        }
      );

      if ((featuredResponse.data.opportunities?.length ?? 0) > 0) {
        return featuredResponse.data;
      }

      const fallbackResponse = await axios.get<OpportunitiesHomeResponse>(
        "/api/opportunities/public",
        {
          params: { limit, offset },
        }
      );

      return fallbackResponse.data;
    },
    staleTime: 1000 * 15,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const opportunities = data?.opportunities ?? [];
  const shouldShowComingSoon =
    !isPending && (isError || opportunities.length < 2);
  const opportunityCardThemes = [
    "bg-[#fff3e0] text-black",
    "bg-[#fffde7] text-black",
  ];

  return (
    <section className="bg-white px-4 py-4 md:px-8 md:py-6">
      <div className="relative space-y-2 text-center">
        <div className="space-y-2">
          <h3
            className={`${outfitClass} text-[30px] leading-[30px] font-medium tracking-[-2.25px] text-black/80`}
          >
            Talk of the hour in Opportunities
          </h3>
          <p
            className={`${outfitClass} text-[20px] leading-5 tracking-[-0.25px] whitespace-nowrap text-black/50`}
          >
            Step up, stand out - bring the A-game.
          </p>
        </div>

        <Link
          href="/opportunities"
          className={`${sfProClass} hidden text-[16px] leading-[30px] font-medium tracking-[-1px] whitespace-nowrap text-[#ff6e00] md:absolute md:top-0 md:right-0 md:inline-block`}
        >
          See All
        </Link>
      </div>

      <div className="hide-scrollbar mt-[10px] overflow-x-auto">
        <div role="list" className="flex w-max gap-4">
          {opportunities.map((opportunity, index) => (
            <Link
              key={opportunity.id}
              href={`/opportunities/${opportunity.id}`}
              className={`flex h-[199px] w-[160px] shrink-0 flex-col items-center justify-center rounded-2xl border border-black/20 p-4 text-center md:h-[280px] md:w-[240px] md:p-6 ${opportunityCardThemes[index % opportunityCardThemes.length]}`}
            >
              <div className="relative mb-[10px] size-10 md:mb-6">
                <Image
                  src="/images/Shape Set.svg"
                  alt="Opportunity icon"
                  fill
                  className="object-contain"
                />
              </div>
              <h4
                className={`${outfitClass} line-clamp-3 max-w-full overflow-hidden text-center text-[20px] leading-[26px] font-medium tracking-[-0.25px] break-words hyphens-auto md:text-[28px] md:leading-[34px]`}
              >
                {opportunity.title}
              </h4>
            </Link>
          ))}

          {shouldShowComingSoon ? (
            <article className="flex h-[199px] w-[160px] shrink-0 flex-col items-center justify-center rounded-2xl border border-dashed border-black/25 bg-black/[0.03] px-4 text-center md:h-[280px] md:w-[240px]">
              <p
                className={`${outfitClass} text-[20px] leading-[24px] font-medium tracking-[-0.25px] text-black/80 md:text-[24px] md:leading-[30px]`}
              >
                Coming Soon,
              </p>
              <p
                className={`${sfProClass} mt-1 text-[14px] leading-[18px] text-black/60 md:text-[16px] md:leading-[22px]`}
              >
                Stay Tuned!
              </p>
            </article>
          ) : null}
        </div>
      </div>

      <Link
        href="/opportunities"
        className={`${sfProClass} mt-4 text-left text-[16px] leading-[30px] font-medium tracking-[-1px] text-[#ff6e00] md:hidden`}
      >
        See All
      </Link>
    </section>
  );
}
