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
    <div className="flex flex-col h-full grow">
      <main className="flex-1 bg-gradient-to-b from-background to-orange-50">
        <section className="py-24 md:py-28 container mx-auto">
          <div className="px-4 text-center">
            <div className="max-w-6xl mx-auto">
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-sm mb-4 w-52 mx-auto bg-orange-600/10 border border-orange-600/70 rounded-full shadow-xl shadow-amber-600/10 py-2"
              >
                Built for ambitious students
              </motion.p>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className={`${righteous.className} font-semibold text-4xl md:text-7xl text-foreground mb-6 leading-tight`}
              >
                Because the right{" "}
                <span className="text-orange-600/70">opportunity</span> changes
                everything.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="text-base md:text-lg text-muted-foreground mb-8 max-w-2xl mx-auto"
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
                whileHover={{ scale: 1.1 }}
                className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 mx-auto"
              >
                <Button
                  size="lg"
                  className="text-base px-8"
                  onClick={() => router.push("/opportunities")}
                >
                  Find your next opportunity
                  <ArrowRight />
                </Button>
              </motion.div>
            </div>
          </div>
        </section>
        <section className="bg-orange-600/60 mb-4 rounded-xl shadow-lg p-12 container mx-auto min-h-[600px] flex flex-col gap-4 justify-center">
          <h2 className="text-3xl font-bold text-center text-white mb-8">
            Supercharge Your Growth
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{
                scale: 1.05,
                boxShadow: "0 10px 20px rgba(0,0,0,0.12)",
              }}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col cursor-pointer"
            >
              <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]" />
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="font-semibold text-xl mb-3 flex items-center gap-2 text-gray-900">
                  <ArrowRight className="w-5 h-5 text-orange-600" />
                  Access Opportunities
                </h3>
                <p className="text-base text-gray-700 flex-1">
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
              className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col cursor-pointer"
            >
              <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]" />
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="font-semibold text-xl mb-3 flex items-center gap-2 text-gray-900">
                  <ArrowRight className="w-5 h-5 text-orange-600" />
                  Crafted Resources
                </h3>
                <p className="text-base text-gray-700 flex-1">
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
              className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col cursor-pointer"
            >
              <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]" />
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="font-semibold text-xl mb-3 flex items-center gap-2 text-gray-900">
                  <ArrowRight className="w-5 h-5 text-orange-600" />
                  Stay Ahead of Deadlines
                </h3>
                <p className="text-base text-gray-700 flex-1">
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
