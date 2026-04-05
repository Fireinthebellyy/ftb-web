"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Link from "next/link";
import {
  Briefcase,
  Calculator,
  Code,
  Database,
  Layout,
  Lightbulb,
  Megaphone,
  Paintbrush,
} from "lucide-react";
import { Internship } from "@/types/interfaces";

interface HomeInternshipCardsSectionProps {
  outfitClass: string;
  sfProClass: string;
}

function getDomainIcon(
  title: string,
  className: string = "h-10 w-10 text-slate-700 md:h-12 md:w-12"
) {
  const t = title.toLowerCase();

  if (
    t.includes("develop") ||
    t.includes("software") ||
    t.includes("engineer") ||
    t.includes("tech")
  ) {
    return <Code className={className} />;
  }

  if (
    t.includes("design") ||
    t.includes("ui") ||
    t.includes("visual") ||
    t.includes("creative")
  ) {
    return <Paintbrush className={className} />;
  }

  if (
    t.includes("market") ||
    t.includes("seo") ||
    t.includes("social") ||
    t.includes("content")
  ) {
    return <Megaphone className={className} />;
  }

  if (
    t.includes("data") ||
    t.includes("analy") ||
    t.includes("machine") ||
    t.includes("ai")
  ) {
    return <Database className={className} />;
  }

  if (
    t.includes("finance") ||
    t.includes("account") ||
    t.includes("business") ||
    t.includes("sales")
  ) {
    return <Calculator className={className} />;
  }

  if (t.includes("product") || t.includes("manage") || t.includes("admin")) {
    return <Layout className={className} />;
  }

  if (t.includes("intern") || t.includes("trainee")) {
    return <Lightbulb className={className} />;
  }

  return <Briefcase className={className} />;
}

export default function HomeInternshipCardsSection({
  outfitClass,
  sfProClass,
}: HomeInternshipCardsSectionProps) {
  const limit = 8;
  const offset = 0;

  const { data } = useQuery<{ internships: Internship[] }>({
    queryKey: ["internships-home", limit, offset],
    queryFn: async () => {
      const response = await axios.get<{ internships: Internship[] }>(
        "/api/internships",
        {
          params: { limit, offset, preferred: "featured" },
        }
      );

      return response.data;
    },
    staleTime: 1000 * 60,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  const internships = data?.internships ?? [];

  return (
    <section className="bg-white px-4 py-4 md:px-8 md:py-6">
      <div className="flex flex-col gap-4">
        <div className="relative space-y-2 text-center">
          <div className="space-y-2">
            <h3
              className={`${outfitClass} whitespace-pre-line md:whitespace-nowrap text-[30px] leading-[30px] font-medium tracking-[-2.25px] text-black/80`}
            >
              {"This week’s internships-\nworth a shot"}
            </h3>
            <p
              className={`${outfitClass} whitespace-nowrap text-[20px] leading-5 tracking-[-0.25px] text-black/50`}
            >
              Build skills, not just your resume
            </p>
          </div>

          <Link
            href="/internships"
            className={`${sfProClass} hidden whitespace-nowrap text-[16px] leading-[30px] font-medium tracking-[-1px] text-[#ff6e00] md:absolute md:top-0 md:right-0 md:inline-block`}
          >
            See All
          </Link>
        </div>

        <div className="hide-scrollbar overflow-x-auto">
          <div role="list" className="flex w-max gap-4">
            {internships.length > 0 ? (
              internships.map((internship) => (
                <article
                  key={internship.id}
                  className="relative h-[199px] w-[160px] shrink-0 overflow-hidden rounded-2xl border border-black/20 md:h-[280px] md:w-[240px]"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-[#fdfbfb] to-[#ebedee]" />

                  <div className="absolute inset-x-0 top-5 z-10 flex justify-center md:top-7">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/80 bg-white/70 shadow-sm backdrop-blur-[2px] md:h-16 md:w-16">
                      {getDomainIcon(internship.title)}
                    </div>
                  </div>

                  <div className="absolute right-3 bottom-3 left-3 z-10">
                    <h4
                      className={`${outfitClass} line-clamp-2 text-[15px] leading-[18px] font-medium tracking-[-0.25px] text-black/90 md:text-[20px] md:leading-[24px]`}
                    >
                      {internship.title}
                    </h4>
                    <p
                      className={`${sfProClass} mt-1 line-clamp-1 text-[12px] leading-[14px] text-black/65 md:text-[14px] md:leading-[18px]`}
                    >
                      {internship.hiringOrganization}
                    </p>
                    <Link
                      href={`/intern/${internship.id}`}
                      className={`${sfProClass} mt-2 inline-flex h-8 items-center justify-center rounded-[39px] bg-black px-3 text-[12px] leading-none font-medium tracking-[-0.25px] text-white md:h-9 md:text-[13px]`}
                    >
                      Explore
                    </Link>
                  </div>
                </article>
              ))
            ) : (
              <article className="flex h-[199px] w-[220px] shrink-0 items-center justify-center rounded-2xl border border-dashed border-black/25 px-4 text-center md:h-[280px] md:w-[300px]">
                <p
                  className={`${outfitClass} text-[20px] leading-[24px] text-black/60`}
                >
                  Coming Soon, Stay Tuned!
                </p>
              </article>
            )}
          </div>
        </div>

        <Link
          href="/internships"
          className={`${sfProClass} text-left text-[16px] leading-[30px] font-medium tracking-[-1px] text-[#ff6e00] md:hidden`}
        >
          See All
        </Link>
      </div>
    </section>
  );
}
