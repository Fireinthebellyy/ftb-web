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
      <main className="flex-1 bg-gradient-to-br from-background to-orange-50">
        <section className="py-24 md:py-32">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-6xl mx-auto">
              {/* <p className="text-sm mb-4 w-48 mx-auto bg-green-700/10 border border-green-700 text-green-700 rounded-lg shadow py-2">
                For ambitious students
              </p> */}

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className={`${righteous.className} font-semibold text-4xl md:text-7xl text-foreground mb-6 leading-tight`}
              >
                Because the right{" "}
                <span className="text-orange-600">opportunity</span> changes
                everything.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="text-base md:text-lg text-muted-foreground mb-8 max-w-2xl mx-auto"
              >
                Access hackathons, grants, and competitions. Learn from curated
                resources. Bookmark everything and never miss an application
                deadline.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
              >
                <Button
                  size="lg"
                  className="text-base px-8"
                  onClick={() => router.push("/opportunities")}
                >
                  Browse opportunities
                  <ArrowRight />
                </Button>
              </motion.div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
