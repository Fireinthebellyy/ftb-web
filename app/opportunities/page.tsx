import { Metadata } from 'next';
import OpportunityList from './OpportunityList';
import { db } from '@/lib/db';
import { tags } from '@/lib/schema';

export const dynamic = 'force-dynamic';

// Metadata
export const metadata: Metadata = {
  title: 'Opportunities — Hackathons, Fellowships & Competitions',
  description:
    'Find verified hackathons, grants, case competitions, fellowships, and scholarships in India. Filter by tag and never miss a deadline.',
  openGraph: {
    title: 'Discover Opportunities — Fire in the Belly',
    description:
      'Hackathons, fellowships, case competitions, and more — curated and verified for Indian students.',
    images: [{ url: '/images/og-opportunities.png', width: 1200, height: 630, alt: 'Opportunities on Fire in the Belly' }],
  },
  twitter: { card: 'summary_large_image' },
};

const Opportunitypage = async () => {
  let initialTags: string[] = [];
  try {
    const dbTags = await db.select({ name: tags.name }).from(tags);
    initialTags = dbTags.map((t) => t.name);
  } catch (error) {
    console.error("Error fetching initial tags in Opportunitypage:", error);
    // Fallback to empty array if DB fails
    initialTags = [];
  }

  return <OpportunityList initialTags={initialTags} />;
};

export default Opportunitypage
