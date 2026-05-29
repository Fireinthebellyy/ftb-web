import React from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Toolkit } from "@/components/admin/types";
import HtmlRenderer from "@/components/toolkit/HtmlRenderer";
import {
  BookOpen,
  Clock,
  Cloud,
  Check,
  Linkedin,
  Instagram,
  Mail,
  Phone,
  Link as LinkIcon,
  Star,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface MentorshipViewProps {
  toolkit: Toolkit;
}

export default function MentorshipView({ toolkit }: MentorshipViewProps) {
  const heroImageUrl = toolkit.bannerImageUrl || toolkit.coverImageUrl;
  const mentorshipDetails = toolkit.mentorshipDetails;
  const mentor = mentorshipDetails?.mentor;

  return (
    <div className="space-y-3">
      {/* Small Header Section */}
      <div className="flex flex-col gap-4 md:flex-row">
        {heroImageUrl && (
          <div className="relative h-48 w-full shrink-0 overflow-hidden rounded-lg bg-gray-100 md:w-72 md:h-52">
            <Image
              src={heroImageUrl}
              alt={toolkit.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 300px"
            />
          </div>
        )}
        <div className="flex flex-1 flex-col justify-center">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {toolkit.category && (
              <Badge variant="secondary">{toolkit.category}</Badge>
            )}
          </div>
          <h1 className="mb-3 text-2xl font-bold text-gray-900 md:text-3xl">
            {toolkit.title.charAt(0).toUpperCase() + toolkit.title.slice(1)}
          </h1>
          <div className="mb-4 flex flex-wrap items-center gap-4 text-sm text-gray-500">
            {toolkit.rating && (
              <div className="flex shrink-0 items-center gap-1 rounded-md bg-yellow-50 px-1.5 py-0.5 text-sm font-semibold text-yellow-700 border border-yellow-200/50">
                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                {toolkit.rating}
              </div>
            )}

            {toolkit.totalDuration && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {toolkit.totalDuration}
              </div>
            )}
            <div className="flex items-center gap-1">
              <Cloud className="h-4 w-4" />
              Lifetime access
            </div>
          </div>
        </div>
      </div>

      {/* DESKTOP LAYOUT (Hidden on mobile) */}
      <div className="hidden md:flex flex-col gap-6">
        {/* About the mentor (Full width on top) */}
        {mentor && (
          <Card>
            <CardHeader>
              <CardTitle>About the mentor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-6 md:flex-row items-center md:items-start">
                {mentor.imageUrl && (
                  <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-full border bg-gray-100">
                    <Image
                      src={mentor.imageUrl}
                      alt={mentor.name || "Mentor"}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 space-y-4 text-center md:text-left">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {mentor.name}
                    </h3>
                    {mentor.description && (
                      <p className="mt-2 text-sm text-gray-600">
                        {mentor.description}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-3 md:justify-start">
                    {mentor.linkedinUrl && (
                      <a
                        href={mentor.linkedinUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        <Linkedin className="h-4 w-4" /> LinkedIn
                      </a>
                    )}
                    {mentor.instagramUrl && (
                      <a
                        href={mentor.instagramUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-sm font-medium text-pink-600 hover:text-pink-800"
                      >
                        <Instagram className="h-4 w-4" /> Instagram
                      </a>
                    )}
                    {mentor.mailId && (
                      <a
                        href={`mailto:${mentor.mailId}`}
                        className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900"
                      >
                        <Mail className="h-4 w-4" /> {mentor.mailId}
                      </a>
                    )}
                    {mentor.phoneNumber && (
                      <span className="flex items-center gap-1 text-sm font-medium text-gray-600">
                        <Phone className="h-4 w-4" /> {mentor.phoneNumber}
                      </span>
                    )}
                  </div>
                  {mentor.otherLinks && mentor.otherLinks.length > 0 && (
                    <div className="flex flex-wrap items-center justify-center gap-3 md:justify-start">
                      {mentor.otherLinks.map((link, idx) => (
                        <a
                          key={idx}
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
                        >
                          <LinkIcon className="h-4 w-4" /> {link.title}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 1) Description Card (Full width) */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <HtmlRenderer content={toolkit.description} className="text-gray-700" />
          </CardContent>
        </Card>

        {/* 2-Column Grid for Packed and Format */}
        {(mentorshipDetails?.mentorshipPacked || mentorshipDetails?.formatOfMentorship) && (
          <div className="grid gap-6 md:grid-cols-2">
            {/* 2) What is the mentorship packed */}
            {mentorshipDetails?.mentorshipPacked && (
              <Card className="flex flex-col h-full">
                <CardHeader>
                  <CardTitle>What is the mentorship packed?</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <HtmlRenderer
                    content={mentorshipDetails.mentorshipPacked}
                    className="text-gray-700"
                  />
                </CardContent>
              </Card>
            )}

            {/* 3) Format of mentorship */}
            {mentorshipDetails?.formatOfMentorship && (
              <Card className="flex flex-col h-full">
                <CardHeader>
                  <CardTitle>Format of mentorship</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <HtmlRenderer
                    content={mentorshipDetails.formatOfMentorship}
                    className="text-gray-700"
                  />
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* MOBILE LAYOUT (Hidden on desktop) */}
      <div className="block md:hidden">
        <Accordion type="multiple" className="w-full space-y-4">
          
          {/* About the mentor Accordion */}
          {mentor && (
            <AccordionItem value="mentor" className="border rounded-lg bg-card text-card-foreground shadow-sm">
              <AccordionTrigger className="px-6 py-4 hover:no-underline rounded-lg">
                <span className="font-semibold text-lg">About the mentor</span>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4 pt-2 border-t">
                <div className="flex flex-col gap-6 items-center">
                  {mentor.imageUrl && (
                    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border bg-gray-100">
                      <Image
                        src={mentor.imageUrl}
                        alt={mentor.name || "Mentor"}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 space-y-4 text-center">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {mentor.name}
                      </h3>
                      {mentor.description && (
                        <p className="mt-2 text-sm text-gray-600">
                          {mentor.description}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-center gap-3">
                      {mentor.linkedinUrl && (
                        <a
                          href={mentor.linkedinUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
                        >
                          <Linkedin className="h-4 w-4" /> LinkedIn
                        </a>
                      )}
                      {mentor.instagramUrl && (
                        <a
                          href={mentor.instagramUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-sm font-medium text-pink-600 hover:text-pink-800"
                        >
                          <Instagram className="h-4 w-4" /> Instagram
                        </a>
                      )}
                      {mentor.mailId && (
                        <a
                          href={`mailto:${mentor.mailId}`}
                          className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900"
                        >
                          <Mail className="h-4 w-4" /> {mentor.mailId}
                        </a>
                      )}
                      {mentor.phoneNumber && (
                        <span className="flex items-center gap-1 text-sm font-medium text-gray-600">
                          <Phone className="h-4 w-4" /> {mentor.phoneNumber}
                        </span>
                      )}
                    </div>
                    {mentor.otherLinks && mentor.otherLinks.length > 0 && (
                      <div className="flex flex-col items-center gap-3">
                        {mentor.otherLinks.map((link, idx) => (
                          <a
                            key={idx}
                            href={link.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
                          >
                            <LinkIcon className="h-4 w-4" /> {link.title}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Description Accordion */}
          <AccordionItem value="description" className="border rounded-lg bg-card text-card-foreground shadow-sm">
            <AccordionTrigger className="px-6 py-4 hover:no-underline rounded-lg">
              <span className="font-semibold text-lg">Description</span>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-4 pt-2 border-t">
              <HtmlRenderer content={toolkit.description} className="text-gray-700" />
            </AccordionContent>
          </AccordionItem>

          {/* Mentorship Packed Accordion */}
          {mentorshipDetails?.mentorshipPacked && (
            <AccordionItem value="packed" className="border rounded-lg bg-card text-card-foreground shadow-sm">
              <AccordionTrigger className="px-6 py-4 hover:no-underline rounded-lg">
                <span className="font-semibold text-lg">What is the mentorship packed?</span>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4 pt-2 border-t">
                <HtmlRenderer
                  content={mentorshipDetails.mentorshipPacked}
                  className="text-gray-700"
                />
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Mentorship Format Accordion */}
          {mentorshipDetails?.formatOfMentorship && (
            <AccordionItem value="format" className="border rounded-lg bg-card text-card-foreground shadow-sm">
              <AccordionTrigger className="px-6 py-4 hover:no-underline rounded-lg">
                <span className="font-semibold text-lg">Format of mentorship</span>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4 pt-2 border-t">
                <HtmlRenderer
                  content={mentorshipDetails.formatOfMentorship}
                  className="text-gray-700"
                />
              </AccordionContent>
            </AccordionItem>
          )}

        </Accordion>
      </div>
    </div>
  );
}
