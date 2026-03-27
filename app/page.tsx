"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Inter, Outfit, Satisfy } from "next/font/google";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const satisfy = Satisfy({
  subsets: ["latin"],
  weight: ["400"],
});

const sfProClass = "font-[\"SF Pro Display\",\"SF Pro Text\",Inter,sans-serif]";

const toolkitCards = [
  { title: "Cold Mailing", description: "", compact: true },
  { title: "Interviews", description: "", compact: true },
  { title: "Case Comp", description: "Buy this toolkit to access\nexclusive content" },
  { title: "CV/Resume", description: "Buy this toolkit to access\nexclusive content" },
  { title: "Random Tool Kit", description: "Buy this toolkit to access\nexclusive content" },
];

const genericCards = [
  "Random Tool Kit",
  "Random Tool Kit",
  "Random Tool Kit",
  "Random Tool Kit",
  "Random Tool Kit",
  "Random Tool Kit",
];

function StarRow({ size = 20 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <span key={index} className="inline-block text-white" style={{ fontSize: `${size}px`, lineHeight: 1 }}>
          ★
        </span>
      ))}
    </div>
  );
}



function HeroSection() {
  return (
    <section className="px-4 py-4 md:px-8 md:py-8">
      <div className="flex flex-col items-center gap-2">
        <div className="flex w-full flex-col items-center gap-4 px-0 pt-[10px] pb-[10px] text-center">
          <h1 className={`${outfit.className} max-w-[408px] text-[44px] leading-[50px] font-bold tracking-[-2.25px] text-black md:max-w-[820px] md:text-[68px] md:leading-[72px]`}>
            Everything you need to get ahead.
            <br />
            Finally, in one place.
          </h1>
          <p className={`${inter.className} max-w-[330px] text-center text-2xl leading-8 font-normal tracking-[-0.25px] text-black/50 md:max-w-[760px] md:text-[30px] md:leading-[38px]`}>
            So you stop missing out and start making smarter moves.
          </p>
        </div>

        <div className="relative h-[256px] w-[282px] md:h-[420px] md:w-[500px]">
          <Image src="/images/pingo.png" alt="Hero visual" fill priority sizes="282px" className="object-contain object-top" />
        </div>
      </div>
    </section>
  );
}

function TaglineSection() {
  return (
    <section className="px-4 pt-4 pb-0 md:px-8 md:pt-6">
      <h2 className="px-[10px] text-center text-[40px] leading-10 tracking-[-2.25px] md:text-[64px] md:leading-[64px]">
        <span className={`${outfit.className} font-bold text-[rgba(0,0,0,0.8)]`}>Turning your</span>
        <span className={`${satisfy.className} text-[#ff6e00]`}> 20&rsquo;s ka suffer</span>
        <span className={`${outfit.className} font-bold text-[rgba(0,0,0,0.8)]`}> into </span>
        <span className={`${satisfy.className} lowercase text-[#ff6e00]`}>सफ़र</span>
      </h2>
    </section>
  );
}

function InternshipStrip() {
  const sliderRef = useRef<HTMLDivElement>(null);

  const slides = [
    {
      key: "internships",
      title: "Internships",
      description: "Apply smarter, track everything & add to calendar - hit the golden window",
      leftImage: "/images/internship.png",
      leftMode: "badge",
    },
    {
      key: "toolkits",
      title: "Toolkits",
      description: "Cold emails, interviews & case comps - mastered with playbooks that ACTUALLY work.",
      leftImage: "/images/toolkits-left.png",
      leftMode: "cover",
    },
    {
      key: "opportunities",
      title: "Opportunities",
      description: "Discover & never ever miss a deadline - hackathons, competitions, fellowships & more",
      leftImage: "/images/opportunities-graphics.png",
      leftMode: "cover",
    },
    {
      key: "ungatekeep",
      title: "Ungatekeep",
      description: "Zero gatekeeping - just recommendations & real answers to college AMAs",
      leftImage: "/images/ungatekeep-left.png",
      leftMode: "cover",
    },
  ] as const;

  const scrollByAmount = (direction: "left" | "right") => {
    if (!sliderRef.current) return;
    const cardWidth = 400;
    const gap = 16;
    const amount = cardWidth + gap;

    sliderRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <section className="pt-4 pb-4 md:px-8 md:py-8">
      <div ref={sliderRef} className="hide-scrollbar overflow-x-auto px-5 md:px-0">
        <div className="flex w-max snap-x snap-mandatory gap-4">
          {slides.map((slide) => (
            <article key={slide.key} className="w-[400px] shrink-0 snap-center md:w-[680px]">
              <div className="mx-auto h-[240px] w-[390px] rounded-2xl border border-black/30 bg-white p-[10px] md:h-[320px] md:w-[660px] md:rounded-[24px] md:p-4">
                <div className="grid h-full grid-cols-[160px_200px] gap-[10px] md:grid-cols-[280px_340px] md:gap-4">
                  {slide.leftMode === "badge" ? (
                    <div className="flex h-[220px] flex-col justify-between rounded-2xl bg-white p-4 md:h-[288px] md:p-6">
                      <div className="h-[37px] w-[142px] rounded-2xl md:h-[56px] md:w-[220px]" />
                      <div className="relative h-[37px] w-[128px] overflow-hidden rounded-2xl md:h-[52px] md:w-[200px]">
                        <Image src={slide.leftImage} alt={`${slide.title} badge`} fill className="object-contain object-left" />
                      </div>
                    </div>
                  ) : (
                    <div className="relative h-[220px] w-[160px] overflow-hidden rounded-2xl md:h-[288px] md:w-[280px]">
                      <Image src={slide.leftImage} alt={`${slide.title} visual`} fill className="object-cover" />
                    </div>
                  )}

                  <div className="flex h-[220px] flex-col border border-black/30 bg-white p-3 md:h-[288px] md:p-5">
                    <div className="mb-2 flex justify-end md:mb-4">
                      <div className="relative size-[50px] overflow-hidden md:size-[72px]">
                        <Image src="/images/ftb-seal.png" alt="icon" fill className="object-contain" />
                      </div>
                    </div>

                    <div className="mt-1 rounded-2xl px-1 text-center">
                      <h3 className={`${outfit.className} text-[20px] leading-[25px] font-medium text-black md:text-[36px] md:leading-[40px]`}>{slide.title}</h3>
                      <p className={`${sfProClass} mt-2 text-[16px] leading-4 text-black/50 md:text-[24px] md:leading-[26px]`}>{slide.description}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-2 flex items-center justify-center gap-[16.74px]">
                <button
                  type="button"
                  aria-label="Previous slide"
                  onClick={() => scrollByAmount("left")}
                  className="grid size-[46px] place-items-center rounded-full border border-black/20 bg-white text-[#ff6e00]"
                >
                  <ChevronLeft className="size-[30px]" />
                </button>
                <button
                  type="button"
                  aria-label="Next slide"
                  onClick={() => scrollByAmount("right")}
                  className="grid size-[46px] place-items-center rounded-full border border-black/20 bg-white text-[#ff6e00]"
                >
                  <ChevronRight className="size-[30px]" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrustedSection() {
  const logos = ["/images/du.png", "/images/christ.jpg", "/images/srcc.png", "/images/ssc.png", "/images/iim.jpg"];

  return (
    <section className="px-4 pb-0">
      <div className="rounded-2xl bg-white p-4">
        <div className="mx-auto w-fit text-center">
          <p className={`${outfit.className} text-[12px] text-black/50`}>Rated</p>
          <p className={`${outfit.className} text-[40px] leading-[50px] font-bold text-black`}>4.8/5</p>
        </div>
        <p className={`${sfProClass} mt-2 text-center text-[16px] leading-normal`}>
          <span className="font-normal text-[rgba(0,0,0,0.5)]">
            Trusted by ambitious students &amp; early career professionals from across
          </span>
          <span className="font-medium text-[rgba(0,0,0,0.8)]"> </span>
          <span className="font-semibold text-[rgba(0,0,0,0.6)]">Delhi University | Christ University | IIITs | IIMs | BHU</span>
        </p>

        <div className="hide-scrollbar mt-2 overflow-x-auto">
          <div className="flex w-max items-center gap-8 pr-6">
            {logos.concat(logos).map((logo, index) => (
              <div key={`${logo}-${index}`} className="relative h-[81px] w-[70px] shrink-0">
                <Image src={logo} alt="University logo" fill className="object-contain" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ToolkitCarousel() {
  return (
    <section className="mt-0 bg-black px-4 pt-2 pb-2 md:px-8 md:py-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className={`${outfit.className} text-[30px] leading-[30px] font-medium tracking-[-0.25px] text-white`}>Trending toolkits</h3>
          <p className={`${outfit.className} mt-0 text-[20px] leading-5 tracking-[-0.25px] text-[#ff6e00]/75`}>Built to get you moving &amp; acing</p>
        </div>
        <Link href="/toolkit" className={`${outfit.className} text-[16px] leading-[110px] tracking-[-0.25px] text-[#ff6e00]`}>
          See All
        </Link>
      </div>

      <div className="hide-scrollbar overflow-x-auto pb-2">
        <div className="flex w-max gap-2">
          {toolkitCards.map((card, index) => (
            <article
              key={`${card.title}-${index}`}
              className="mt-2 flex h-[270px] w-[218px] shrink-0 flex-col justify-between rounded-2xl border border-white/50 px-4 py-4 md:h-[340px] md:w-[280px] md:px-5 md:py-5"
            >
              <div>
                <h4 className={`${outfit.className} text-center text-[24px] leading-[30px] font-medium tracking-[-0.25px] text-white`}>{card.title}</h4>
                {card.description ? (
                  <p className={`${sfProClass} mt-1 whitespace-pre-line text-center text-[20px] leading-[30px] tracking-[-1px] text-white/50`}>
                    {card.description}
                  </p>
                ) : (
                  <div className="mt-1 flex justify-center">
                    <StarRow size={20} />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-[10px]">
                <button
                  className={`${outfit.className} inline-flex h-12 items-center justify-center whitespace-nowrap rounded-[39px] bg-white px-3 text-[18px] leading-none font-medium tracking-[-0.25px] text-black`}
                >
                  Buy now
                </button>
                <button
                  className={`${sfProClass} inline-flex h-12 items-center justify-center whitespace-nowrap rounded-[39px] border border-white/50 px-3 text-[18px] leading-none font-normal tracking-[-0.25px] text-white/50`}
                >
                  Explore
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function CardCarouselSection({
  title,
  subtitle,
  href,
  spacing = "compact",
}: {
  title: string;
  subtitle: string;
  href: string;
  spacing?: "featured" | "compact";
}) {
  const stackGapClass = spacing === "featured" ? "gap-8" : "gap-4";
  const titleClass =
    spacing === "featured"
      ? `${outfit.className} text-[30px] leading-[30px] font-medium tracking-[-2.25px] text-black/80`
      : `${outfit.className} whitespace-pre-line text-[30px] leading-[30px] font-medium tracking-[-2.25px] text-black/80`;
  const subtitleClass =
    spacing === "featured"
      ? `${outfit.className} w-full text-[20px] leading-5 tracking-[-0.25px] text-black/50`
      : `${outfit.className} whitespace-nowrap text-[20px] leading-5 tracking-[-0.25px] text-black/50`;

  return (
    <section className="bg-white px-4 py-4 md:px-8 md:py-6">
      <div className={`flex flex-col ${stackGapClass}`}>
        <div className="space-y-2 text-center">
          <h3 className={titleClass}>{title}</h3>
          <p className={subtitleClass}>{subtitle}</p>
        </div>

        <div className="hide-scrollbar overflow-x-auto">
          <div className="flex w-max gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="relative h-[199px] w-[160px] shrink-0 overflow-hidden rounded-2xl border border-black/20 md:h-[280px] md:w-[240px]">
                <Image src="/images/graphic1.png" alt="Card visual" fill className="object-cover" />
              </div>
            ))}
          </div>
        </div>

        <Link href={href} className={`${sfProClass} text-left text-[16px] leading-[30px] font-medium tracking-[-1px] text-[#ff6e00]`}>
          Learn more
        </Link>
      </div>
    </section>
  );
}

function OpportunitiesSection() {
  return (
    <section className="bg-white px-4 py-4 md:px-8 md:py-6">
      <div className="space-y-2 text-center">
        <h3 className={`${outfit.className} text-[30px] leading-[30px] font-medium tracking-[-2.25px] text-black/80`}>
          Talk of the hour in Opportunities
        </h3>
        <p className={`${outfit.className} whitespace-nowrap text-[20px] leading-5 tracking-[-0.25px] text-black/50`}>Step up, stand out - bring the A-game.</p>
      </div>

      <div className="hide-scrollbar mt-[10px] overflow-x-auto">
        <div className="flex w-max gap-4">
          {genericCards.map((title, index) => (
            <article key={`${title}-${index}`} className="h-[199px] w-[160px] shrink-0 rounded-2xl border border-black/30 p-4 md:h-[280px] md:w-[240px] md:p-6">
              <div className="relative mx-auto size-10">
                <Image src="/images/Shape Set.svg" alt="Opportunity icon" fill className="object-contain" />
              </div>
              <div className="mt-[10px] px-4 md:mt-6 md:px-2">
                <h4 className={`${outfit.className} whitespace-pre-line text-[24px] leading-[30px] font-medium tracking-[-0.25px] text-black md:text-[34px] md:leading-[40px]`}>
                  Random {"\n"}Tool Kit
                </h4>
              </div>
            </article>
          ))}
        </div>
      </div>

      <Link href="/opportunities" className={`${sfProClass} mt-4 text-left text-[16px] leading-[30px] font-medium tracking-[-1px] text-[#ff6e00]`}>
        Learn more
      </Link>
    </section>
  );
}

function FaqSection() {
  const faqs = [
    {
      question: "What exactly is FTB?",
      answer:
        "FTB is an all-in-one platform for ambitious students across India to discover, track, and apply smarter to legit internships and opportunities. Beyond access, we solve for clarity - with Ungatekeep content and toolkits designed to give you an unfair advantage.",
    },
    {
      question: "Who is FTB for?",
      answer: "Students and early professionals in their 20s who want clarity, direction, and real opportunities to grow.",
    },
    {
      question: "How do I actually use FTB to get ahead?",
      answer: "Explore opportunities, save the ones that fit you, track deadlines, and use toolkits to apply smarter and improve your chances.",
    },
    {
      question: "What kind of opportunities can I find here?",
      answer: "Internships, case competitions, hackathons, fellowships, scholarships, and more - across multiple domains.",
    },
    {
      question: "What is the \"Smart Apply\" feature?",
      answer: "It helps you save, track, and manage your applications in one place - so you never miss the right moment to apply.",
    },
    {
      question: "What are Toolkits? Are they worth it?",
      answer: "Toolkits are step-by-step playbooks to help you land and crack opportunities. If you want to stop guessing and start getting results - they are worth it.",
    },
    {
      question: "What is Ungatekeep?",
      answer: "Everything students usually figure out too late - shared early. From cold emails to interview scripts, real answers and insider breakdowns.",
    },
    {
      question: "Are these opportunities verified?",
      answer: "Yes - opportunities are curated and verified by our team, along with trusted submissions from organizations and communities.",
    },
    {
      question: "Can I intern with FTB or get involved?",
      answer: "Yes! We are always looking for driven people to join us. Keep an eye on openings or reach out - we would love to hear from you.",
    },
    {
      question: "Can I connect 1:1 for guidance or queries?",
      answer:
        "Yes - through mentorship sessions and community support (rolling out soon). You will also find answers through toolkits and Ungatekeep content.",
    },
    {
      question: "How can I share feedback or a testimonial?",
      answer: "We would love that. You can share feedback directly on the platform or reach out to us - we are always building with our users.",
    },
  ];
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="bg-white px-4 py-4 md:px-8 md:py-8">
      <div className="space-y-1 text-center">
        <h3 className={`${outfit.className} text-[30px] leading-[30px] font-medium tracking-[-2.25px] text-black/80`}>
          Frequently Asked Questions
        </h3>
        <p className={`${outfit.className} whitespace-nowrap text-[20px] leading-5 tracking-[-0.25px] text-[#ff6e00]/75`}>#beeninyourshoes</p>
      </div>

      <div className="mt-4">
        {faqs.map((item, index) => (
          <div key={`${item.question}-${index}`} className="rounded-none px-4 py-4">
            <button
              type="button"
              onClick={() => setOpenIndex((prev) => (prev === index ? null : index))}
              className="flex w-full items-center justify-between"
              aria-expanded={openIndex === index}
              aria-controls={`faq-answer-${index}`}
            >
              <p className={`${outfit.className} flex-1 pr-3 text-left text-[20px] leading-[30px] font-medium tracking-[-0.25px] text-black/80`}>
                {item.question}
              </p>
              <Plus className={`size-5 shrink-0 text-black/70 transition-transform ${openIndex === index ? "rotate-45" : "rotate-0"}`} />
            </button>
            {openIndex === index ? (
              <p id={`faq-answer-${index}`} className={`${sfProClass} mt-2 pr-8 text-left text-[16px] leading-6 tracking-[-0.25px] text-black/60`}>
                {item.answer}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <main className={`${outfit.className} min-h-screen bg-white text-black md:bg-[radial-gradient(120%_120%_at_50%_0%,#ffffff_0%,#f3f4f6_100%)]`}>
      <div className="mx-auto w-full max-w-[440px] md:max-w-none md:[&>section]:mx-auto md:[&>section]:w-full md:[&>section]:max-w-[1240px]">
        <HeroSection />
        <TaglineSection />
        <InternshipStrip />
        <TrustedSection />
        <ToolkitCarousel />
        <CardCarouselSection
          title="Truly UnGATEKEEPED"
          subtitle="Posting everything students usually figure out too late."
          href="/ungatekeep"
          spacing="featured"
        />
        <CardCarouselSection
          title={"This week’s internships-\nworth a shot"}
          subtitle="Build skills, not just your resume"
          href="/internships"
          spacing="compact"
        />
        <OpportunitiesSection />
        <FaqSection />
      </div>
    </main>
  );
}
