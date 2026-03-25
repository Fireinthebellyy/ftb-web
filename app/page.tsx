import { ArrowRight, Star } from "lucide-react";
import { Archivo_Black, Space_Grotesk } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const archivoBlack = Archivo_Black({
  subsets: ["latin"],
  weight: "400",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});



const toolkitCards = [
  {
    title: "Productivity Kit",
    description: "Essential tools to boost your daily efficiency and output.",
  },
  {
    title: "Career Starter Kit",
    description: "Everything you need to land your first high-paying role.",
  },
  {
    title: "Interview Mastery",
    description: "Mock interviews and resources to ace any technical round.",
  },
];

const universityLogos = [
  {
    alt: "University of Delhi",
    label: "University of Delhi",
    src: "https://www.figma.com/api/mcp/asset/ff93751d-13fe-45b7-a1d5-a2407d47ac23",
  },
  {
    alt: "Christ University",
    label: "Christ University",
    src: "https://www.figma.com/api/mcp/asset/4e409eea-d7dd-407e-ae06-b6a336a4d784",
  },
  {
    alt: "Jawaharlal Nehru University",
    label: "Jawaharlal Nehru University",
    src: "https://www.figma.com/api/mcp/asset/2acb0a60-392f-42a8-a0d0-6c8689a5f882",
  },
  {
    alt: "Lovely Professional University",
    label: "Lovely Professional University",
    src: "https://www.figma.com/api/mcp/asset/2d2ca4db-9f0b-465c-8372-076454be26a9",
  },
];

function UniversityLogoBanner() {
  return (
    <section className="w-full">
      <p className="text-sm tracking-[0.12em] text-black/45 uppercase">Our Partners</p>
      <h2 className={`${archivoBlack.className} mt-2 text-3xl leading-tight md:text-4xl`}>
        Trusted by Students Across Universities
      </h2>
      <p className="mt-2 text-base text-black/55">Exclusive Internship and Opportunities</p>
      <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4">
        {universityLogos.map((logo) => (
          <div key={logo.alt} className="flex flex-col items-center gap-3 text-center">
            <Image src={logo.src} alt={logo.alt} width={80} height={62} className="h-[62px] w-[80px] object-contain" />
            <p className="text-[14px] leading-[1.2] text-black/50">{logo.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function MobileToolkitCard({ title, description }: { title: string; description: string }) {
  return (
    <article className="flex h-[343px] min-w-[340px] flex-col justify-between rounded-[24px] border border-black/10 bg-white p-4 shadow-[0_6px_16px_rgba(0,0,0,0.06)]">
      <div className="space-y-4">
        <div className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/15 text-xs font-semibold text-primary">
          FTB
        </div>
        <h3 className="text-[34px] leading-[0.95] font-semibold text-black">{title}</h3>
        <p className="max-w-[308px] text-[15px] text-black/70">{description}</p>
        <div className="flex items-center justify-center gap-2 text-primary">
          {Array.from({ length: 5 }).map((_, index) => (
            <Star key={index} className="size-4 fill-current" />
          ))}
        </div>
      </div>
      <Button className="mx-auto h-11 w-[152px] rounded-full bg-black px-5 text-sm text-white hover:bg-black/90">
        Buy now
      </Button>
    </article>
  );
}

function DesktopToolkitCard({ title, description }: { title: string; description: string }) {
  return (
    <article className="flex h-[280px] min-w-[260px] flex-col justify-between rounded-[24px] border border-black/10 bg-white p-5 shadow-[0_6px_16px_rgba(0,0,0,0.06)] md:min-w-[300px]">
      <div className="space-y-5">
        <div className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/15 text-xs font-semibold text-primary">
          FTB
        </div>
        <h3 className="text-xl leading-[1.1] font-semibold text-black">{title}</h3>
        <p className="max-w-[32ch] text-sm text-black/70">{description}</p>
        <div className="flex items-center gap-1 text-primary">
          {Array.from({ length: 5 }).map((_, index) => (
            <Star key={index} className="size-5 fill-current" />
          ))}
        </div>
      </div>
      <Button className="h-10 w-fit rounded-full bg-black px-5 text-sm text-white hover:bg-black/90">
        Buy now
      </Button>
    </article>
  );
}

export default function HomePage() {
  return (
    <main className={`${spaceGrotesk.className} bg-[#fcf9f4] text-black`}>
      <div className="hidden md:block">
        <section className="mx-auto w-full max-w-[1728px] px-4 pt-4 pb-16 md:px-4 md:pt-[16px]">
          <div className="rounded-[42px] border border-black/10 bg-[radial-gradient(circle_at_20%_15%,rgba(255,180,57,0.25),transparent_40%),radial-gradient(circle_at_88%_10%,rgba(0,0,0,0.08),transparent_26%),#fff] p-6 md:p-10">

            <div className="mx-auto max-w-[945px] text-center">

              <h1 className={`${archivoBlack.className} text-balance text-4xl leading-[0.96] tracking-tight md:text-6xl lg:text-7xl`}>
                Find Internships That Actually Fit You
              </h1>

              <p className="mx-auto mt-5 max-w-[820px] text-pretty text-lg leading-relaxed text-black/65 md:text-2xl">
                Discover opportunities tailored to your skills, interests, and career goals all in one place.
              </p>

            </div>

            <div className="mx-auto mt-14 max-w-[830px] overflow-hidden rounded-[34px] border border-black/10 bg-[#101010] p-4 md:p-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-sm tracking-[0.12em] text-white/70 uppercase">Internships</p>
                  <p className="mt-6 text-5xl font-bold text-white">1,280+</p>
                </div>
                <div className="rounded-2xl bg-primary p-4">
                  <p className="text-sm tracking-[0.12em] text-black/70 uppercase">New This Week</p>
                  <p className="mt-6 text-5xl font-bold text-black">346</p>
                </div>
                <div className="relative min-h-[176px] overflow-hidden rounded-2xl bg-white p-4">
                  <p className="text-sm tracking-[0.12em] text-black/60 uppercase">Hiring Partners</p>
                  <p className="mt-6 text-5xl font-bold text-black">420+</p>
                  <div className="absolute right-2 bottom-2">
                    <div className="relative size-20 overflow-hidden rounded-2xl border border-black/10 bg-[#fff9ef]">
                      <Image src="/images/pingo.jpeg" alt="Penguin mascot" fill className="object-cover" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 pt-4 pb-20 text-center md:px-8 md:pt-12 md:pb-24">
          <h2 className={`${archivoBlack.className} mx-auto max-w-[700px] text-balance text-3xl leading-tight md:text-5xl`}>
            Make your Twenties Zafar not Suffer
          </h2>
        </section>

        <section className="px-4 pb-20 md:px-8 md:pb-24">
          <UniversityLogoBanner />
        </section>

        <section className="mx-auto w-full max-w-[1728px] px-4 pb-20 md:px-8 md:pb-24">
          <div className="mx-auto grid max-w-[1600px] gap-8">
            <div className="grid gap-8 md:grid-cols-2">
              <article className="rounded-[34px] border border-black/10 bg-white p-6 shadow-[0_10px_28px_rgba(0,0,0,0.06)] md:min-h-[520px] md:p-9">
                <p className="text-sm tracking-[0.12em] text-black/45 uppercase">Built for students</p>
                <h3 className="mt-4 text-3xl leading-tight font-bold md:text-4xl">One home for internships, toolkit and mentorship</h3>
                <p className="mt-5 max-w-[40ch] text-lg text-black/65">
                  Replace random scrolling and dead-end forms with a clear path to your first great role.
                </p>
                <div className="relative mt-8 h-[220px] overflow-hidden rounded-[28px] bg-[linear-gradient(130deg,#111,#383838)] md:h-[260px]">
                  <Image src="/images/pingo.jpeg" alt="Penguin illustration" fill className="object-cover opacity-80" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
              </article>

              <article className="rounded-[34px] border border-black/10 bg-[#111111] p-6 text-white shadow-[0_10px_28px_rgba(0,0,0,0.16)] md:min-h-[520px] md:p-9">
                <div className="h-[250px] rounded-[28px] border border-white/15 bg-[linear-gradient(145deg,#1f1f1f,#0f0f0f)] p-6 md:h-[280px]">
                  <div className="relative h-full overflow-hidden rounded-[22px] border border-white/20">
                    <Image src="/images/fire-logo.png" alt="FTB graphic" fill className="object-contain p-10" />
                  </div>
                </div>
                <div className="mt-6 flex items-start gap-4 rounded-3xl bg-white/8 p-5">
                  <div className="relative size-14 overflow-hidden rounded-2xl bg-primary/20">
                    <Image src="/images/du.svg" alt="Toolkit icon" fill className="object-contain p-3" />
                  </div>
                  <div>
                    <h3 className="text-2xl leading-none font-bold md:text-3xl">Exclusive Tool Kits</h3>
                    <p className="mt-2 text-base text-white/70 md:text-lg">Exclusive Internship and Oppurtunities</p>
                  </div>
                </div>
              </article>
            </div>

            <article className="grid h-auto gap-6 rounded-[34px] border border-black/10 bg-white p-6 shadow-[0_10px_28px_rgba(0,0,0,0.06)] md:grid-cols-[1.6fr_1fr] md:items-center md:p-9">
              <div className="flex items-center gap-5">
                <div className="relative size-14 overflow-hidden rounded-2xl bg-primary/15">
                  <Image src="/images/du.svg" alt="Ungatekeep icon" fill className="object-contain p-3" />
                </div>
                <div>
                  <p className="text-sm tracking-[0.12em] text-black/45 uppercase">UnGATEKEEPED</p>
                  <h3 className="mt-2 text-3xl leading-tight font-bold md:text-4xl">Exclusive Internship and Oppurtunities</h3>
                </div>
              </div>
              <div className="relative h-[300px] overflow-hidden rounded-[28px] bg-[linear-gradient(130deg,#ffd48d,#ff9e45)] md:h-[420px]">
                <div className="absolute -top-6 -left-6 size-24 rounded-full bg-white/45" />
                <div className="absolute -right-5 -bottom-5 size-28 rounded-full bg-black/10" />
                <div className="absolute right-6 bottom-6 flex items-end gap-3">
                  <div className="relative size-20 overflow-hidden rounded-2xl border border-black/10 bg-white/80 md:size-24">
                    <Image src="/images/pingo.jpeg" alt="Penguin mascot" fill className="object-cover" />
                  </div>
                  <div className="relative size-12 overflow-hidden rounded-xl border border-black/10 bg-white/80 md:size-14">
                    <Image src="/images/fire-logo.png" alt="Brand badge" fill className="object-contain p-2" />
                  </div>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1728px] px-4 pb-24 md:px-8 md:pb-28">
          <div className="mx-auto mb-7 flex max-w-[1600px] items-end justify-between gap-4">
            <h2 className={`${archivoBlack.className} text-3xl md:text-5xl`}>Trending Toolkits</h2>
            <Link href="/toolkit" className="flex items-center gap-2 text-lg font-semibold text-black/75 hover:text-black">
              See All
              <ArrowRight className="size-5" />
            </Link>
          </div>

          <div className="hide-scrollbar mx-auto flex max-w-[1600px] gap-8 overflow-x-auto pb-2">
            {toolkitCards.map((card, index) => (
              <DesktopToolkitCard key={`${card.title}-${index}`} title={card.title} description={card.description} />
            ))}
          </div>
        </section>
      </div>

      <div className="mx-auto min-h-screen w-full max-w-[440px] px-4 py-4 md:hidden">

        <section className="rounded-[28px] border border-black/10 bg-[radial-gradient(circle_at_20%_15%,rgba(255,180,57,0.26),transparent_40%),#fff] p-4">
          <div className="text-center">

            <h1 className={`${archivoBlack.className} mt-4 text-balance px-2 text-[34px] leading-[1.02]`}>
              Find Internships That Actually Fit You
            </h1>
            <p className="mx-auto mt-3 max-w-[320px] text-[14px] leading-6 text-black/65">
              Discover opportunities tailored to your skills, interests, and career goals all in one place.
            </p>

          </div>

          <div className="relative mt-6 h-[238px] overflow-hidden rounded-2xl border border-black/10 bg-[linear-gradient(130deg,#111,#383838)]">
            <Image src="/images/pingo.jpeg" alt="Hero graphic" fill className="object-cover opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        </section>

        <section className="px-3 py-6 text-center">
          <h2 className={`${archivoBlack.className} mx-auto max-w-[300px] text-[34px] leading-[0.95]`}>
            Make your Twenties Zafar not Suffer
          </h2>
        </section>

        <section className="pb-4">
          <UniversityLogoBanner />
        </section>

        <section className="mt-4 rounded-[24px] border border-black/10 bg-white p-4 shadow-[0_6px_16px_rgba(0,0,0,0.06)]">
          <div className="flex items-center gap-3">
            <div className="relative size-10 overflow-hidden rounded-lg bg-primary/15">
              <Image src="/images/du.svg" alt="Ungatekeep icon" fill className="object-contain p-2" />
            </div>
            <div>
              <p className="text-[11px] tracking-[0.12em] text-black/45 uppercase">UnGATEKEEPED</p>
              <h3 className="text-xl leading-tight font-bold">Exclusive Internship and Oppurtunities</h3>
            </div>
          </div>
          <div className="relative mt-4 h-[140px] overflow-hidden rounded-xl bg-[linear-gradient(130deg,#ffd48d,#ff9e45)]">
            <div className="absolute right-3 bottom-3 flex items-end gap-2">
              <div className="relative size-12 overflow-hidden rounded-lg border border-black/10 bg-white/80">
                <Image src="/images/pingo.jpeg" alt="Penguin mascot" fill className="object-cover" />
              </div>
              <div className="relative size-8 overflow-hidden rounded-md border border-black/10 bg-white/80">
                <Image src="/images/fire-logo.png" alt="Brand badge" fill className="object-contain p-1.5" />
              </div>
            </div>
          </div>
        </section>

        <section className="pt-4">
          <div className="mb-3 flex items-end justify-between">
            <h2 className={`${archivoBlack.className} text-3xl leading-none`}>Trending Toolkits</h2>
            <Link href="/toolkit" className="flex items-center gap-1 text-xs font-semibold text-black/75 hover:text-black">
              See All
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-2">
            {toolkitCards.map((card, index) => (
              <MobileToolkitCard key={`${card.title}-${index}`} title={card.title} description={card.description} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
