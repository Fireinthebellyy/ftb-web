import { Metadata } from 'next';
import OpportunityList from './OpportunityList';
import { db } from '@/lib/db';
import { tags } from '@/lib/schema';

// Metadata
export const metadata: Metadata = {
  title: 'OpportunityHub - Discover Amazing Opportunities',
  description:
    'Find hackathons, grants, competitions, ideathons and more. Connect with opportunities that match your skills and interests.',
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
