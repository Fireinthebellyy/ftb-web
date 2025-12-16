import { db } from "@/lib/db";
import { internships, tags, user } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, MapPin, Building2, IndianRupee, ExternalLink, User } from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";
import Link from "next/link";

export default async function InternshipDetailPage({ params }: any) {
  const id = params.id;

  const result = await db
    .select({
      id: internships.id,
      type: internships.type,
      title: internships.title,
      description: internships.description,
      link: internships.link,
      poster: internships.poster,
      tags: sql<string[]>`(
        SELECT coalesce(array_agg(t.name ORDER BY t.name), '{}')
        FROM ${tags} t
        WHERE t.id = ANY(${internships.tagIds})
      )`,
      location: internships.location,
      deadline: internships.deadline,
      stipend: internships.stipend,
      hiringOrganization: internships.hiringOrganization,
      hiringManager: internships.hiringManager,
      createdAt: internships.createdAt,
      viewCount: internships.viewCount,
      applicationCount: internships.applicationCount,
      user: {
        id: user.id,
        name: user.name,
        image: user.image,
        role: user.role,
      },
    })
    .from(internships)
    .leftJoin(user, eq(internships.userId, user.id))
    .where(eq(internships.id, id))
    .limit(1);

  const internship = result?.[0];
  if (!internship) {
    notFound();
  }

  const getTypeColor = (type?: string): string => {
    const colors: Record<string, string> = {
      "part-time": "bg-blue-100 text-blue-800",
      "full-time": "bg-green-100 text-green-800",
      contract: "bg-purple-100 text-purple-800",
      remote: "bg-orange-100 text-orange-800",
    };
    return colors[type?.toLowerCase() || "part-time"] || colors["part-time"];
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6">
      {/* Header Section */}
      <div className="bg-white rounded-lg border shadow-sm p-6 mb-6">
        {/* Type Badge */}
        <div className="flex justify-between items-start mb-4">
          <Badge
            className={`${getTypeColor(internship.type)} px-3 py-1 text-sm font-medium`}
          >
            {internship.type?.charAt(0).toUpperCase() + internship.type?.slice(1).replace("-", " ")}
          </Badge>
          <div className="text-sm text-gray-500">
            Posted {format(new Date(internship.createdAt), "MMM dd, yyyy")}
          </div>
        </div>

        {/* Title and Organization */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{internship.title}</h1>
          <div className="flex items-center gap-2 text-lg text-gray-700">
            <Building2 className="w-5 h-5" />
            <span>{internship.hiringOrganization}</span>
          </div>
        </div>

        {/* Key Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {internship.location && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">{internship.location}</span>
            </div>
          )}

          {internship.stipend && (
            <div className="flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">₹{internship.stipend.toLocaleString("en-IN")}/month</span>
            </div>
          )}

          {internship.deadline && (
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">Deadline: {format(new Date(internship.deadline), "MMM dd, yyyy")}</span>
            </div>
          )}
        </div>

        {/* Apply Button */}
        {internship.link && (
          <div className="flex gap-3">
            <Link href={`${internship.link}?utm_source=ftb_web&utm_medium=internship_detail&utm_campaign=internship_apply`} target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3">
                <ExternalLink className="w-4 h-4 mr-2" />
                Apply Now
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Poster Image */}
      {internship.poster && (
        <div className="bg-white rounded-lg border shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Company Poster</h2>
          <div className="flex justify-center">
            <Image
              src={internship.poster}
              alt={`${internship.title} poster`}
              width={600}
              height={400}
              className="rounded-lg object-cover max-w-full h-auto"
            />
          </div>
        </div>
      )}

      {/* Description */}
      {internship.description && (
        <div className="bg-white rounded-lg border shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Description</h2>
          <div className="prose max-w-none text-gray-700">
            {typeof internship.description === "string" ? (
              <p className="whitespace-pre-wrap">{internship.description}</p>
            ) : (
              internship.description
            )}
          </div>
        </div>
      )}

      {/* Tags */}
      {internship.tags && internship.tags.length > 0 && (
        <div className="bg-white rounded-lg border shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Tags</h2>
          <div className="flex flex-wrap gap-2">
            {internship.tags.map((tag, idx) => (
              <Badge
                key={idx}
                className="bg-blue-50 text-blue-700 border-blue-200"
              >
                #{tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Contact Information */}
      {(internship.hiringManager || internship.user) && (
        <div className="bg-white rounded-lg border shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
          <div className="space-y-3">
            {internship.hiringManager && (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-sm">
                  <span className="font-medium">Hiring Manager:</span> {internship.hiringManager}
                </span>
              </div>
            )}
            {internship.user && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  {internship.user.image ? (
                    <Image
                      src={internship.user.image}
                      alt={internship.user.name}
                      width={32}
                      height={32}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-gray-600">
                      {internship.user.name?.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </span>
                  )}
                </div>
                <span className="text-sm">
                  <span className="font-medium">Posted by:</span> {internship.user.name}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Internship Stats</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{internship.viewCount || 0}</div>
            <div className="text-sm text-gray-600">Views</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{internship.applicationCount || 0}</div>
            <div className="text-sm text-gray-600">Applications</div>
          </div>
        </div>
      </div>
    </div>
  );
}
