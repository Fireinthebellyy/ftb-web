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
  const dbTags = await db.select({ name: tags.name }).from(tags);
  const initialTags = dbTags.map(t => t.name);

  return <OpportunityList initialTags={initialTags} />
}

export default Opportunitypage
