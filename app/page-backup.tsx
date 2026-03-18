"use client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Righteous } from "next/font/google";
import { useRouter } from "next/navigation";

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
                  variant="default"
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
      </main>
    </div>
  );
}
