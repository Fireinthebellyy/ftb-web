import { Metadata } from "next";
import { getAllChangelogEntries, getChangeTypeColor } from "@/lib/changelog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Sparkles } from "lucide-react";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export const metadata: Metadata = {
  title: "Changelog - FTB",
  description: "Stay up to date with the latest features, improvements, and fixes to FTB.",
};

export default async function ChangelogPage() {
  const entries = await getAllChangelogEntries();

  return (
    <div className="container mx-auto py-8 px-4 md:py-12">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <Sparkles className="h-8 w-8 text-orange-600" />
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              Changelog
            </h1>
          </div>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
            Stay up to date with the latest features, improvements, and fixes to
            FTB.
          </p>
        </div>

        {/* Changelog Entries */}
        {entries.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No changelog entries yet. Check back soon!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {entries.map((entry) => (
              <Card key={entry.slug} className="overflow-hidden">
                <CardHeader>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <time dateTime={entry.date}>
                          {format(new Date(entry.date), "MMMM d, yyyy")}
                        </time>
                        {entry.isMajor && (
                          <Badge variant="default" className="ml-2">
                            Major Release
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="mb-2 text-2xl">
                        {entry.title}
                      </CardTitle>
                      <CardDescription className="text-base">
                        {entry.summary}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                {entry.changes.length > 0 && (
                  <CardContent>
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Changes</h3>
                      <div className="space-y-3">
                        {entry.changes.map((change, index) => (
                          <div
                            key={index}
                            className="rounded-lg border bg-muted/50 p-4"
                          >
                            <div className="mb-2 flex items-center gap-2">
                              <Badge
                                className={getChangeTypeColor(change.type)}
                              >
                                {change.type}
                              </Badge>
                              <h4 className="font-semibold">{change.title}</h4>
                            </div>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                              {change.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                )}

                {entry.content && (
                  <CardContent className="border-t pt-6">
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {entry.content}
                      </ReactMarkdown>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
