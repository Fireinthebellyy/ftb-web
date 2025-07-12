import { Metadata } from 'next';
import OpportunityList from './OpportunityList';

// Metadata
export const metadata: Metadata = {
  title: 'OpportunityHub - Discover Amazing Opportunities',
  description:
    'Find hackathons, grants, competitions, ideathons and more. Connect with opportunities that match your skills and interests.',
};

const Opportunitypage = () => {
  return <OpportunityList />
}

export default Opportunitypage
