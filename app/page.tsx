"use client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Righteous } from "next/font/google";
import { useRouter } from "next/navigation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const righteous = Righteous({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-righteous",
});

export default function LandingPage() {
  const router = useRouter();
  return (
    <div className="flex h-full grow flex-col">
      <main className="flex-1 bg-gradient-to-b from-neutral-50 via-orange-50 to-neutral-50">
        <section className="container mx-auto py-24 md:py-28">
          <div className="px-4 text-center">
            <div className="mx-auto max-w-6xl">
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mx-auto mb-4 w-52 rounded-full border border-orange-600/70 bg-orange-600/10 py-2 text-sm shadow-xl shadow-amber-600/10"
              >
                Built for ambitious students
              </motion.p>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className={`${righteous.className} text-foreground mb-6 text-4xl leading-tight font-semibold tracking-tight md:text-7xl`}
              >
                Because the right{" "}
                <span className="text-orange-600/70">opportunity</span> changes
                everything.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="text-muted-foreground mx-auto mb-8 max-w-2xl text-base md:text-lg"
              >
                Access hackathons, grants, and competitions. Bookmark everything
                and stay ahead of every deadline.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  default: { duration: 0.5, delay: 0.6 },
                  scale: { duration: 0.1 },
                }}
                whileHover={{ scale: 1.1, transition: { duration: 0.2 } }}
                className="mx-auto mb-12 flex w-fit flex-col items-center justify-center gap-4 sm:flex-row"
              >
                <Button
                  size="lg"
                  variant="primary"
                  className="px-8 text-base text-shadow-sm"
                  onClick={() => router.push("/opportunities")}
                >
                  Find your next opportunity
                  <ArrowRight />
                </Button>
              </motion.div>
            </div>
          </div>
        </section>
        <section className="container mx-auto mb-4 flex min-h-[600px] flex-col justify-center gap-4 rounded-xl bg-orange-600/60 p-12 shadow-lg">
          <h2 className="mb-8 text-center text-3xl font-bold text-white">
            Supercharge Your Growth
          </h2>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{
                scale: 1.05,
                boxShadow: "0 10px 20px rgba(0,0,0,0.12)",
              }}
              className="flex cursor-pointer flex-col overflow-hidden rounded-xl border border-gray-200 bg-white"
            >
              <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]" />
              </div>
              <div className="flex flex-1 flex-col p-6">
                <h3 className="mb-3 flex items-center gap-2 text-xl font-semibold text-gray-900">
                  <ArrowRight className="h-5 w-5 text-orange-600" />
                  Access Opportunities
                </h3>
                <p className="flex-1 text-base text-gray-700">
                  Discover hackathons, grants, and competitions.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{
                scale: 1.05,
                boxShadow: "0 10px 20px rgba(0,0,0,0.12)",
              }}
              className="flex cursor-pointer flex-col overflow-hidden rounded-xl border border-gray-200 bg-white"
            >
              <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]" />
              </div>
              <div className="flex flex-1 flex-col p-6">
                <h3 className="mb-3 flex items-center gap-2 text-xl font-semibold text-gray-900">
                  <ArrowRight className="h-5 w-5 text-orange-600" />
                  Crafted Resources
                </h3>
                <p className="flex-1 text-base text-gray-700">
                  Access carefully selected resources on our featured route to
                  boost your learning.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              whileHover={{
                scale: 1.05,
                boxShadow: "0 10px 20px rgba(0,0,0,0.12)",
              }}
              className="flex cursor-pointer flex-col overflow-hidden rounded-xl border border-gray-200 bg-white"
            >
              <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]" />
              </div>
              <div className="flex flex-1 flex-col p-6">
                <h3 className="mb-3 flex items-center gap-2 text-xl font-semibold text-gray-900">
                  <ArrowRight className="h-5 w-5 text-orange-600" />
                  Stay Ahead of Deadlines
                </h3>
                <p className="flex-1 text-base text-gray-700">
                  Bookmark opportunities and never miss important deadlines.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="container mx-auto py-24 md:py-28">
          <div className="px-4">
            <div className="mx-auto max-w-6xl">
              <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-start">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="lg:sticky lg:top-24"
                >
                  <h2
                    className={`${righteous.className} mb-4 text-3xl font-semibold tracking-tight md:text-5xl`}
                  >
                    Frequently Asked Questions
                  </h2>
                  <p className="text-muted-foreground mb-6 text-base leading-relaxed md:text-lg">
                    Everything you need to know about finding and managing opportunities
                  </p>
                  <p className="text-muted-foreground text-sm leading-relaxed md:text-base">
                    Have questions? We&apos;ve got answers. Browse through our most commonly
                    asked questions to learn more about how our platform works and how it
                    can help you discover your next big opportunity.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Accordion type="single" collapsible className="w-full space-y-4">
                    <AccordionItem
                      value="item-1"
                      className="rounded-lg border border-gray-200 bg-white px-6 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <AccordionTrigger className="text-left font-semibold text-gray-900 hover:no-underline">
                        What types of opportunities can I find on this platform?
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground text-base leading-relaxed">
                        Our platform features a wide range of opportunities including
                        hackathons, grants, competitions, internships, scholarships, and
                        other programs designed for ambitious students. You can browse by
                        category, filter by deadline, and discover opportunities that match
                        your interests and goals.
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem
                      value="item-2"
                      className="rounded-lg border border-gray-200 bg-white px-6 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <AccordionTrigger className="text-left font-semibold text-gray-900 hover:no-underline">
                        How do bookmarks work?
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground text-base leading-relaxed">
                        You can bookmark any opportunity that interests you to save it for
                        later. Bookmarked opportunities are stored in your profile, making
                        it easy to track deadlines and revisit opportunities you&apos;re
                        considering. This helps you stay organized and never miss an
                        important deadline.
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem
                      value="item-3"
                      className="rounded-lg border border-gray-200 bg-white px-6 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <AccordionTrigger className="text-left font-semibold text-gray-900 hover:no-underline">
                        Is the platform free to use?
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground text-base leading-relaxed">
                        Yes! Our platform is completely free for students. You can browse
                        opportunities, create bookmarks, set up your profile, and access all
                        features without any cost. We&apos;re committed to making opportunities
                        accessible to all ambitious students.
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem
                      value="item-4"
                      className="rounded-lg border border-gray-200 bg-white px-6 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <AccordionTrigger className="text-left font-semibold text-gray-900 hover:no-underline">
                        How do I stay updated on new opportunities?
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground text-base leading-relaxed">
                        New opportunities are added regularly to the platform. You can
                        browse the opportunities page to see the latest additions, filter by
                        date, and check the featured section for curated highlights. Make
                        sure to bookmark opportunities you&apos;re interested in to track their
                        deadlines.
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem
                      value="item-5"
                      className="rounded-lg border border-gray-200 bg-white px-6 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <AccordionTrigger className="text-left font-semibold text-gray-900 hover:no-underline">
                        Can I submit my own opportunities?
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground text-base leading-relaxed">
                        Currently, opportunities are curated by our team to ensure quality
                        and relevance. If you know of an opportunity that should be featured
                        on our platform, please reach out through our feedback system. We&apos;re
                        always looking to expand our database with valuable opportunities for
                        students.
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem
                      value="item-6"
                      className="rounded-lg border border-gray-200 bg-white px-6 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <AccordionTrigger className="text-left font-semibold text-gray-900 hover:no-underline">
                        What information do I need to create an account?
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground text-base leading-relaxed">
                        Creating an account is simple and quick. You&apos;ll need a valid email
                        address to sign up. Once registered, you can enhance your profile
                        with information about your interests, current role, and field of
                        study to get personalized opportunity recommendations.
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </motion.div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
