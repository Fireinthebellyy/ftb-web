import { Metadata } from 'next';
import InternshipList from '@/components/InternshipList';

// Metadata
export const metadata: Metadata = {
  title: 'InternshipHub - Find Your Dream Internship',
  description:
    'Discover internships across various industries. Find part-time, full-time, and remote internship opportunities with competitive stipends.',
};

const InternshipPage = () => {
  return <InternshipList />;
};

export default InternshipPage;
