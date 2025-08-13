import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col h-full grow">
      <main className="flex-1">
        <section className="py-24 md:py-32 bg-background">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-3xl mx-auto">
              <p className="text-sm mb-4 w-48 mx-auto bg-lime-200 text-gray-700 rounded-full shadow py-2">
                For ambitious students
              </p>

              <h1 className="font-display font-bold text-4xl md:text-6xl text-foreground mb-6 leading-tight">
                Find opportunities, learn skills, track your progress
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Access hackathons, grants, and competitions. Learn from curated
                resources. Bookmark everything and never miss an application
                deadline.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                <Button size="lg" className="text-base px-8">
                  Browse opportunities
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
